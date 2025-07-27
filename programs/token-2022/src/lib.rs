use anchor_lang::prelude::*;
use anchor_spl::token_2022::{
    self, 
    Token2022, 
    TokenAccount, 
    Mint, 
    TransferHook, 
    ConfidentialTransferAccount,
    MetadataPointer,
    ConfidentialTransferMint
};
use spl_math::precise_number::PreciseNumber;

declare_id!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

#[program]
pub mod token_2022 {
    use super::*;

    /// Initialize a new Token-2022 mint with advanced features
    pub fn initialize_mint(
        ctx: Context<InitializeMint>,
        decimals: u8,
        transfer_hook_program_id: Option<Pubkey>,
        confidential_transfer_mint: Option<ConfidentialTransferMint>,
        metadata_pointer: Option<MetadataPointer>,
    ) -> Result<()> {
        let mint = &mut ctx.accounts.mint;
        let authority = &ctx.accounts.authority;
        
        // Initialize the mint with Token-2022
        token_2022::initialize_mint3(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token_2022::InitializeMint3 {
                    mint: mint.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
            ),
            decimals,
            &authority.key(),
            Some(&authority.key()),
            transfer_hook_program_id,
            confidential_transfer_mint,
            metadata_pointer,
        )?;

        msg!("Token-2022 mint initialized successfully");
        Ok(())
    }

    /// Create a Token-2022 account with transfer hook support
    pub fn create_account(
        ctx: Context<CreateAccount>,
    ) -> Result<()> {
        let account = &mut ctx.accounts.account;
        let mint = &ctx.accounts.mint;
        let owner = &ctx.accounts.owner;
        let authority = &ctx.accounts.authority;

        token_2022::initialize_account3(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token_2022::InitializeAccount3 {
                    account: account.to_account_info(),
                    mint: mint.to_account_info(),
                    authority: authority.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
            ),
            &owner.key(),
        )?;

        msg!("Token-2022 account created successfully");
        Ok(())
    }

    /// Transfer tokens with custom transfer hook logic
    pub fn transfer_with_hook(
        ctx: Context<TransferWithHook>,
        amount: u64,
    ) -> Result<()> {
        let source = &ctx.accounts.source;
        let destination = &ctx.accounts.destination;
        let authority = &ctx.accounts.authority;
        let mint = &ctx.accounts.mint;

        // Execute transfer with hook
        token_2022::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token_2022::Transfer {
                    source: source.to_account_info(),
                    destination: destination.to_account_info(),
                    authority: authority.to_account_info(),
                    mint: mint.to_account_info(),
                },
            ),
            amount,
        )?;

        msg!("Transfer with hook executed successfully");
        Ok(())
    }

    /// Enable confidential transfers for a token account
    pub fn enable_confidential_transfers(
        ctx: Context<EnableConfidentialTransfers>,
    ) -> Result<()> {
        let account = &mut ctx.accounts.account;
        let authority = &ctx.accounts.authority;
        let mint = &ctx.accounts.mint;

        token_2022::confidential_transfer::approve_account(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token_2022::confidential_transfer::ApproveAccount {
                    account: account.to_account_info(),
                    mint: mint.to_account_info(),
                    authority: authority.to_account_info(),
                    multisigners: &[],
                },
            ),
            &ctx.accounts.confidential_transfer_mint,
        )?;

        msg!("Confidential transfers enabled successfully");
        Ok(())
    }

    /// Perform a confidential transfer
    pub fn confidential_transfer(
        ctx: Context<ConfidentialTransfer>,
        amount: u64,
        decimals: u8,
    ) -> Result<()> {
        let source = &mut ctx.accounts.source;
        let destination = &mut ctx.accounts.destination;
        let authority = &ctx.accounts.authority;
        let mint = &ctx.accounts.mint;

        token_2022::confidential_transfer::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token_2022::confidential_transfer::Transfer {
                    source: source.to_account_info(),
                    destination: destination.to_account_info(),
                    authority: authority.to_account_info(),
                    mint: mint.to_account_info(),
                    multisigners: &[],
                },
            ),
            amount,
            decimals,
        )?;

        msg!("Confidential transfer executed successfully");
        Ok(())
    }

    /// Set metadata pointer for dynamic metadata
    pub fn set_metadata_pointer(
        ctx: Context<SetMetadataPointer>,
        metadata_pointer: MetadataPointer,
    ) -> Result<()> {
        let mint = &mut ctx.accounts.mint;
        let authority = &ctx.accounts.authority;

        token_2022::set_metadata_pointer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token_2022::SetMetadataPointer {
                    mint: mint.to_account_info(),
                    authority: authority.to_account_info(),
                    multisigners: &[],
                },
            ),
            &metadata_pointer,
        )?;

        msg!("Metadata pointer set successfully");
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

        token_2022::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token_2022::MintTo {
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

        token_2022::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token_2022::Burn {
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
    pub mint: Account<'info, Mint>,
    pub authority: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct CreateAccount<'info> {
    #[account(mut)]
    pub account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub owner: Signer<'info>,
    pub authority: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct TransferWithHook<'info> {
    #[account(mut)]
    pub source: Account<'info, TokenAccount>,
    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct EnableConfidentialTransfers<'info> {
    #[account(mut)]
    pub account: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub mint: Account<'info, Mint>,
    /// CHECK: This is the confidential transfer mint configuration
    pub confidential_transfer_mint: AccountInfo<'info>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct ConfidentialTransfer<'info> {
    #[account(mut)]
    pub source: Account<'info, ConfidentialTransferAccount>,
    #[account(mut)]
    pub destination: Account<'info, ConfidentialTransferAccount>,
    pub authority: Signer<'info>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct SetMetadataPointer<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct MintTo<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct Burn<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
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