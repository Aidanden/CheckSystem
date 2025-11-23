import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AccountService } from '../services/account.service';
import { QueryAccountRequest } from '../types';

export class AccountController {
  static async getAll(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const accounts = await AccountService.getAllAccounts();
      res.json(accounts);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch accounts' });
      }
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const account = await AccountService.getAccountById(id);
      res.json(account);
    } catch (error) {
      if (error instanceof Error) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch account' });
      }
    }
  }

  static async queryAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { account_number } = req.body as QueryAccountRequest;
      const account = await AccountService.queryAccount(account_number);

      // Enforce branch-level access: non-admin users cannot query accounts
      // that are assigned to another branch.
      if (req.user && !req.user.isAdmin) {
        // If account has a branchId and it differs from the user's branch - deny
        if (account.branchId && req.user.branchId && account.branchId !== req.user.branchId) {
          res.status(403).json({ error: 'غير مسموح بالوصول لحساب تابع لفرع آخر' });
          return;
        }
      }

      res.json(account);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to query account' });
      }
    }
  }
}

