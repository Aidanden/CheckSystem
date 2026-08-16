import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { BranchService } from '../services/branch.service';
import { CreateBranchRequest } from '../types';
import { assertSameBranchCode, assertSameBranchId, getUserBranchScope, sendBranchError } from '../utils/branchAccess';

export class BranchController {
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      let branches = await BranchService.getAllBranches();
      try {
        const scope = req.user ? await getUserBranchScope(req.user) : { isAdmin: true as const };
        if (!scope.isAdmin) {
          branches = branches.filter((b) => b.id === scope.branchId);
        }
      } catch (err) {
        if (sendBranchError(res, err)) return;
        throw err;
      }
      res.json(branches);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch branches' });
      }
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const branch = await BranchService.getBranchById(id);
      try {
        await assertSameBranchId(req.user, id);
      } catch (err) {
        if (sendBranchError(res, err)) return;
        throw err;
      }
      res.json(branch);
    } catch (error) {
      if (error instanceof Error) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch branch' });
      }
    }
  }

  static async getByCode(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const branch = await BranchService.getBranchByCode(code);

      if (!branch) {
        res.status(404).json({ error: 'Branch not found' });
        return;
      }

      try {
        await assertSameBranchCode(req.user, branch.branchNumber || code);
      } catch (err) {
        if (sendBranchError(res, err)) return;
        throw err;
      }

      res.json(branch);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch branch by code' });
      }
    }
  }

  static async getByAccountNumber(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { accountNumber } = req.params;
      try {
        await assertSameBranchCode(req.user, accountNumber.slice(0, 3));
      } catch (err) {
        if (sendBranchError(res, err)) return;
        throw err;
      }

      const branch = await BranchService.getBranchByAccountNumber(accountNumber);

      if (!branch) {
        res.status(404).json({ error: 'Branch not found for this account number' });
        return;
      }

      res.json(branch);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch branch by account number' });
      }
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data: CreateBranchRequest = req.body;
      const branch = await BranchService.createBranch(data);
      res.status(201).json(branch);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create branch' });
      }
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const data: Partial<CreateBranchRequest> = req.body;
      const branch = await BranchService.updateBranch(id, data);
      res.json(branch);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update branch' });
      }
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      await BranchService.deleteBranch(id);
      res.json({ message: 'Branch deleted successfully' });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete branch' });
      }
    }
  }
}

