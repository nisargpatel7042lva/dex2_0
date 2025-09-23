
use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, Token2022, TokenAccount, Mint};
use spl_math::precise_number::PreciseNumber;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod amm {
    use super::*;

    /// Initialize a new AMM pool for Token-2022 tokens
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        pool_bump: u8,
        fee_rate: u64, // Fee rate in basis points (e.g., 30 = 0.3%)
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let authority = &ctx.accounts.authority;
        
        // Initialize pool data
        pool.authority = authority.key();
        pool.token_a_mint = ctx.accounts.token_a_mint.key();
        pool.token_b_mint = ctx.accounts.token_b_mint.key();
        pool.token_a_vault = ctx.accounts.token_a_vault.key();
        pool.token_b_vault = ctx.accounts.token_b_vault.key();
        pool.lp_mint = ctx.accounts.lp_mint.key();
        pool.fee_rate = fee_rate;
        pool.total_liquidity = 0;
        pool.token_a_reserves = 0;
        pool.token_b_reserves = 0;
        pool.pool_bump = pool_bump;
        pool.is_active = true;

        msg!("AMM pool initialized successfully");
        msg!("Pool: {}", pool.key());
        msg!("Token A: {}", pool.token_a_mint);
        msg!("Token B: {}", pool.token_b_mint);
        msg!("Fee Rate: {} basis points", fee_rate);

        Ok(())
    }

    /// Add liquidity to the pool
    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        token_a_amount: u64,
        token_b_amount: u64,
        min_lp_tokens: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let user_token_a = &mut ctx.accounts.user_token_a;
        let user_token_b = &mut ctx.accounts.user_token_b;
        let user_lp_tokens = &mut ctx.accounts.user_lp_tokens;
        let pool_token_a_vault = &mut ctx.accounts.pool_token_a_vault;
        let pool_token_b_vault = &mut ctx.accounts.pool_token_b_vault;
        let lp_mint = &mut ctx.accounts.lp_mint;
        let user = &ctx.accounts.user;

        require!(pool.is_active, AmmError::PoolInactive);
        require!(token_a_amount > 0 && token_b_amount > 0, AmmError::InvalidAmount);

        // Calculate LP tokens to mint
        let lp_tokens_to_mint = if pool.total_liquidity == 0 {
            // First liquidity provider
            let lp_amount = (token_a_amount as u128 * token_b_amount as u128).sqrt() as u64;
            require!(lp_amount >= min_lp_tokens, AmmError::InsufficientLpTokens);
            lp_amount
        } else {
            // Calculate based on existing reserves
            let lp_from_a = (token_a_amount as u128 * pool.total_liquidity as u128 / pool.token_a_reserves as u128) as u64;
            let lp_from_b = (token_b_amount as u128 * pool.total_liquidity as u128 / pool.token_b_reserves as u128) as u64;
            let lp_amount = std::cmp::min(lp_from_a, lp_from_b);
            require!(lp_amount >= min_lp_tokens, AmmError::InsufficientLpTokens);
            lp_amount
        };

        // Transfer tokens to pool vaults
        token_2022::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token_2022::Transfer {
                    from: user_token_a.to_account_info(),
                    to: pool_token_a_vault.to_account_info(),
                    authority: user.to_account_info(),
                },
            ),
            token_a_amount,
        )?;

        token_2022::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token_2022::Transfer {
                    from: user_token_b.to_account_info(),
                    to: pool_token_b_vault.to_account_info(),
                    authority: user.to_account_info(),
                },
            ),
            token_b_amount,
        )?;

        // Mint LP tokens to user
        token_2022::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token_2022::MintTo {
                    mint: lp_mint.to_account_info(),
                    to: user_lp_tokens.to_account_info(),
                    authority: &ctx.accounts.pool_authority.to_account_info(),
                },
            ),
            lp_tokens_to_mint,
        )?;

        // Update pool state
        pool.token_a_reserves += token_a_amount;
        pool.token_b_reserves += token_b_amount;
        pool.total_liquidity += lp_tokens_to_mint;

        msg!("Liquidity added successfully");
        msg!("LP tokens minted: {}", lp_tokens_to_mint);
        msg!("New reserves - A: {}, B: {}", pool.token_a_reserves, pool.token_b_reserves);

        Ok(())
    }

    /// Remove liquidity from the pool
    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        lp_tokens_amount: u64,
        min_token_a: u64,
        min_token_b: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let user_lp_tokens = &mut ctx.accounts.user_lp_tokens;
        let user_token_a = &mut ctx.accounts.user_token_a;
        let user_token_b = &mut ctx.accounts.user_token_b;
        let pool_token_a_vault = &mut ctx.accounts.pool_token_a_vault;
        let pool_token_b_vault = &mut ctx.accounts.pool_token_b_vault;
        let lp_mint = &mut ctx.accounts.lp_mint;
        let user = &ctx.accounts.user;

        require!(pool.is_active, AmmError::PoolInactive);
        require!(lp_tokens_amount > 0, AmmError::InvalidAmount);
        require!(lp_tokens_amount <= pool.total_liquidity, AmmError::InsufficientLiquidity);

        // Calculate tokens to return
        let token_a_amount = (lp_tokens_amount as u128 * pool.token_a_reserves as u128 / pool.total_liquidity as u128) as u64;
        let token_b_amount = (lp_tokens_amount as u128 * pool.token_b_reserves as u128 / pool.total_liquidity as u128) as u64;

        require!(token_a_amount >= min_token_a, AmmError::InsufficientTokenA);
        require!(token_b_amount >= min_token_b, AmmError::InsufficientTokenB);

        // Burn LP tokens
        token_2022::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token_2022::Burn {
                    mint: lp_mint.to_account_info(),
                    from: user_lp_tokens.to_account_info(),
                    authority: user.to_account_info(),
                },
            ),
            lp_tokens_amount,
        )?;

        // Transfer tokens from pool vaults to user
        token_2022::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token_2022::Transfer {
                    from: pool_token_a_vault.to_account_info(),
                    to: user_token_a.to_account_info(),
                    authority: &ctx.accounts.pool_authority.to_account_info(),
                },
            ),
            token_a_amount,
        )?;

        token_2022::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token_2022::Transfer {
                    from: pool_token_b_vault.to_account_info(),
                    to: user_token_b.to_account_info(),
                    authority: &ctx.accounts.pool_authority.to_account_info(),
                },
            ),
            token_b_amount,
        )?;

        // Update pool state
        pool.token_a_reserves -= token_a_amount;
        pool.token_b_reserves -= token_b_amount;
        pool.total_liquidity -= lp_tokens_amount;

        msg!("Liquidity removed successfully");
        msg!("Tokens returned - A: {}, B: {}", token_a_amount, token_b_amount);

        Ok(())
    }

    /// Swap tokens using constant product formula
    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        min_amount_out: u64,
        is_token_a_to_b: bool,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let user_token_in = &mut ctx.accounts.user_token_in;
        let user_token_out = &mut ctx.accounts.user_token_out;
        let pool_token_in_vault = &mut ctx.accounts.pool_token_in_vault;
        let pool_token_out_vault = &mut ctx.accounts.pool_token_out_vault;
        let user = &ctx.accounts.user;

        require!(pool.is_active, AmmError::PoolInactive);
        require!(amount_in > 0, AmmError::InvalidAmount);

        // Calculate amount out using constant product formula
        let amount_out = if is_token_a_to_b {
            calculate_swap_output(
                amount_in,
                pool.token_a_reserves,
                pool.token_b_reserves,
                pool.fee_rate,
            )
        } else {
            calculate_swap_output(
                amount_in,
                pool.token_b_reserves,
                pool.token_a_reserves,
                pool.fee_rate,
            )
        };

        require!(amount_out >= min_amount_out, AmmError::InsufficientOutputAmount);

        // Transfer tokens from user to pool
        token_2022::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token_2022::Transfer {
                    from: user_token_in.to_account_info(),
                    to: pool_token_in_vault.to_account_info(),
                    authority: user.to_account_info(),
                },
            ),
            amount_in,
        )?;

        // Transfer tokens from pool to user
        token_2022::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token_2022::Transfer {
                    from: pool_token_out_vault.to_account_info(),
                    to: user_token_out.to_account_info(),
                    authority: &ctx.accounts.pool_authority.to_account_info(),
                },
            ),
            amount_out,
        )?;

        // Update pool reserves
        if is_token_a_to_b {
            pool.token_a_reserves += amount_in;
            pool.token_b_reserves -= amount_out;
        } else {
            pool.token_b_reserves += amount_in;
            pool.token_a_reserves -= amount_out;
        }

        msg!("Swap executed successfully");
        msg!("Amount in: {}, Amount out: {}", amount_in, amount_out);

        Ok(())
    }

    /// Emergency pause/unpause pool
    pub fn set_pool_status(
        ctx: Context<SetPoolStatus>,
        is_active: bool,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let authority = &ctx.accounts.authority;

        require!(pool.authority == authority.key(), AmmError::Unauthorized);

        pool.is_active = is_active;

        msg!("Pool status updated: {}", if is_active { "Active" } else { "Paused" });

        Ok(())
    }
}

// Helper function to calculate swap output using constant product formula
fn calculate_swap_output(
    amount_in: u64,
    reserve_in: u64,
    reserve_out: u64,
    fee_rate: u64,
) -> u64 {
    let amount_in_with_fee = amount_in as u128 * (10000 - fee_rate) as u128;
    let numerator = amount_in_with_fee * reserve_out as u128;
    let denominator = (reserve_in as u128 * 10000) + amount_in_with_fee;
    
    (numerator / denominator) as u64
}

#[derive(Accounts)]
#[instruction(pool_bump: u8)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = authority,
        space = Pool::LEN,
        seeds = [
            b"pool",
            token_a_mint.key().as_ref(),
            token_b_mint.key().as_ref(),
        ],
        bump = pool_bump,
    )]
    pub pool: Account<'info, Pool>,
    
    pub token_a_mint: Account<'info, Mint>,
    pub token_b_mint: Account<'info, Mint>,
    
    #[account(
        constraint = token_a_vault.mint == token_a_mint.key(),
    )]
    pub token_a_vault: Account<'info, TokenAccount>,
    
    #[account(
        constraint = token_b_vault.mint == token_b_mint.key(),
    )]
    pub token_b_vault: Account<'info, TokenAccount>,
    
    #[account(
        constraint = lp_mint.mint_authority.unwrap() == pool.key(),
    )]
    pub lp_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, anchor_lang::system_program::System>,
    pub token_program: Program<'info, Token2022>,
    pub rent: Sysvar<'info, anchor_lang::system_program::Rent>,
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    
    #[account(mut)]
    pub user_token_a: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_token_b: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_lp_tokens: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub pool_token_a_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub pool_token_b_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub lp_mint: Account<'info, Mint>,
    
    /// CHECK: This is the pool authority PDA
    #[account(
        seeds = [b"pool_authority", pool.key().as_ref()],
        bump = pool.pool_bump,
    )]
    pub pool_authority: AccountInfo<'info>,
    
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    
    #[account(mut)]
    pub user_lp_tokens: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_token_a: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_token_b: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub pool_token_a_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub pool_token_b_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub lp_mint: Account<'info, Mint>,
    
    /// CHECK: This is the pool authority PDA
    #[account(
        seeds = [b"pool_authority", pool.key().as_ref()],
        bump = pool.pool_bump,
    )]
    pub pool_authority: AccountInfo<'info>,
    
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    
    #[account(mut)]
    pub user_token_in: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_token_out: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub pool_token_in_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub pool_token_out_vault: Account<'info, TokenAccount>,
    
    /// CHECK: This is the pool authority PDA
    #[account(
        seeds = [b"pool_authority", pool.key().as_ref()],
        bump = pool.pool_bump,
    )]
    pub pool_authority: AccountInfo<'info>,
    
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct SetPoolStatus<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    pub authority: Signer<'info>,
}

#[account]
pub struct Pool {
    pub authority: Pubkey,
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub token_a_vault: Pubkey,
    pub token_b_vault: Pubkey,
    pub lp_mint: Pubkey,
    pub fee_rate: u64,
    pub total_liquidity: u64,
    pub token_a_reserves: u64,
    pub token_b_reserves: u64,
    pub pool_bump: u8,
    pub is_active: bool,
}

impl Pool {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // token_a_mint
        32 + // token_b_mint
        32 + // token_a_vault
        32 + // token_b_vault
        32 + // lp_mint
        8 +  // fee_rate
        8 +  // total_liquidity
        8 +  // token_a_reserves
        8 +  // token_b_reserves
        1 +  // pool_bump
        1;   // is_active
}

#[error_code]
pub enum AmmError {
    #[msg("Pool is inactive")]
    PoolInactive,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient LP tokens")]
    InsufficientLpTokens,
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    #[msg("Insufficient token A")]
    InsufficientTokenA,
    #[msg("Insufficient token B")]
    InsufficientTokenB,
    #[msg("Insufficient output amount")]
    InsufficientOutputAmount,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid pool")]
    InvalidPool,
    #[msg("Invalid token account")]
    InvalidTokenAccount,
}

// Events for tracking
#[event]
pub struct PoolInitialized {
    pub pool: Pubkey,
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub authority: Pubkey,
    pub fee_rate: u64,
}

#[event]
pub struct LiquidityAdded {
    pub pool: Pubkey,
    pub user: Pubkey,
    pub token_a_amount: u64,
    pub token_b_amount: u64,
    pub lp_tokens_minted: u64,
}

#[event]
pub struct LiquidityRemoved {
    pub pool: Pubkey,
    pub user: Pubkey,
    pub lp_tokens_burned: u64,
    pub token_a_amount: u64,
    pub token_b_amount: u64,
}

#[event]
pub struct SwapExecuted {
    pub pool: Pubkey,
    pub user: Pubkey,
    pub token_in: Pubkey,
    pub token_out: Pubkey,
    pub amount_in: u64,
    pub amount_out: u64,
    pub fee: u64,
} 