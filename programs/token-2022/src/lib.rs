

use anchor_lang::prelude::*;
use anchor_spl::token_2022 as spl_token_2022;
use anchor_spl::token_2022::Token2022;

declare_id!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

#[program]
pub mod token_2022_program {
    use super::*;

    pub fn initialize_mint(
        ctx: Context<InitializeMint>,
        decimals: u8,
    ) -> Result<()> {
        let mint = &mut ctx.accounts.mint;
        let authority = &ctx.accounts.authority;
        
        spl_token_2022::initialize_mint(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                spl_token_2022::InitializeMint {
                    mint: mint.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
            ),
            decimals,
            &authority.key(),
            Some(&authority.key()),
        )?;

        msg!("Token-2022 mint initialized successfully");
        Ok(())
    }

    pub fn create_token_account(
        ctx: Context<CreateAccount>,
    ) -> Result<()> {
        let account = &mut ctx.accounts.account;
        let mint = &ctx.accounts.mint;
        let owner = &ctx.accounts.owner;

        spl_token_2022::initialize_account3(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                spl_token_2022::InitializeAccount3 {
                    account: account.to_account_info(),
                    mint: mint.to_account_info(),
                    authority: owner.to_account_info(),
                },
            ),
        )?;

        msg!("Token-2022 account created successfully");
        Ok(())
    }

    /// Transfer tokens
    pub fn transfer_tokens(
        ctx: Context<TransferTokens>,
        amount: u64,
        decimals: u8,
    ) -> Result<()> {
        let from = &ctx.accounts.from;
        let to = &ctx.accounts.to;
        let authority = &ctx.accounts.authority;

        // Execute transfer
        spl_token_2022::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                spl_token_2022::TransferChecked {
                    from: from.to_account_info(),
                    to: to.to_account_info(),
                    authority: authority.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                },
            ),
            amount,
            decimals,
        )?;

        msg!("Transfer executed successfully");
        Ok(())
    }

    /// Mint tokens to an account
    pub fn mint_to(
        ctx: Context<MintTo>,
        amount: u64,
    ) -> Result<()> {
        let mint = &mut ctx.accounts.mint;
        let to = &mut ctx.accounts.to;
        let authority = &ctx.accounts.authority;

        spl_token_2022::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                spl_token_2022::MintTo {
                    mint: mint.to_account_info(),
                    to: to.to_account_info(),
                    authority: authority.to_account_info(),
                },
            ),
            amount,
        )?;

        msg!("Tokens minted successfully");
        Ok(())
    }

    /// Burn tokens from an account
    pub fn burn(
        ctx: Context<Burn>,
        amount: u64,
    ) -> Result<()> {
        let mint = &mut ctx.accounts.mint;
        let from = &mut ctx.accounts.from;
        let authority = &ctx.accounts.authority;

        spl_token_2022::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                spl_token_2022::Burn {
                    mint: mint.to_account_info(),
                    from: from.to_account_info(),
                    authority: authority.to_account_info(),
                },
            ),
            amount,
        )?;

        msg!("Tokens burned successfully");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeMint<'info> {
    #[account(mut)]
    pub mint: AccountInfo<'info>,
    pub authority: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct CreateAccount<'info> {
    #[account(mut)]
    pub account: AccountInfo<'info>,
    pub mint: AccountInfo<'info>,
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub from: AccountInfo<'info>,
    #[account(mut)]
    pub to: AccountInfo<'info>,
    pub authority: Signer<'info>,
    pub mint: AccountInfo<'info>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct MintTo<'info> {
    #[account(mut)]
    pub mint: AccountInfo<'info>,
    #[account(mut)]
    pub to: AccountInfo<'info>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct Burn<'info> {
    #[account(mut)]
    pub mint: AccountInfo<'info>,
    #[account(mut)]
    pub from: AccountInfo<'info>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token2022>,
}

// Error handling
#[error_code]
pub enum Token2022Error {
    #[msg("Invalid mint authority")]
    InvalidMintAuthority,
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Transfer hook failed")]
    TransferHookFailed,
    #[msg("Confidential transfer not enabled")]
    ConfidentialTransferNotEnabled,
    #[msg("Invalid metadata pointer")]
    InvalidMetadataPointer,
}

// Events for tracking
#[event]
pub struct TokenMinted {
    pub mint: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub authority: Pubkey,
}

#[event]
pub struct TokenBurned {
    pub mint: Pubkey,
    pub from: Pubkey,
    pub amount: u64,
    pub authority: Pubkey,
}

#[event]
pub struct TokenTransferred {
    pub mint: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub authority: Pubkey,
}

#[event]
pub struct ConfidentialTransferExecuted {
    pub mint: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub authority: Pubkey,
} 