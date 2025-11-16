import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrintingService } from '../services/printing.service';
import { PrintCheckbookRequest } from '../types';

export class PrintingController {
  static async printCheckbook(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const { account_number, serial_from, serial_to } = req.body as PrintCheckbookRequest;
      
      if (!account_number) {
        res.status(400).json({ 
          success: false,
          error: 'Account number is required' 
        });
        return;
      }

      // Get branchId from user, or find first available branch
      let branchId = req.user.branchId;
      if (!branchId) {
        // Import BranchModel to get first branch
        const { BranchModel } = await import('../models/Branch.model');
        const branches = await BranchModel.findAll();
        if (branches.length === 0) {
          res.status(400).json({
            success: false,
            error: 'No branches available in the system'
          });
          return;
        }
        branchId = branches[0].id;
      }
      
      const result = await PrintingService.printCheckbook(
        account_number,
        req.user.userId,
        branchId,
        serial_from,
        serial_to
      );

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('❌ خطأ في طباعة الشيك:', error);
      if (error instanceof Error) {
        console.error('   التفاصيل:', error.message);
        console.error('   Stack:', error.stack);
        res.status(400).json({ 
          success: false,
          error: error.message,
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to print checkbook',
        });
      }
    }
  }

  static async getPrintHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const branchId = req.query.branch_id 
        ? parseInt(req.query.branch_id as string)
        : undefined;
      const limit = req.query.limit 
        ? parseInt(req.query.limit as string)
        : 100;

      const history = await PrintingService.getPrintHistory(
        undefined,
        branchId,
        limit
      );
      res.json(history);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch print history' });
      }
    }
  }

  static async getStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const branchId = req.query.branch_id 
        ? parseInt(req.query.branch_id as string)
        : undefined;

      const stats = await PrintingService.getPrintStatistics(branchId);
      res.json(stats);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch statistics' });
      }
    }
  }

  static async downloadPDF(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      const path = require('path');
      const fs = require('fs');
      
      // Validate filename to prevent directory traversal
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        res.status(400).json({ error: 'Invalid filename' });
        return;
      }

      const filepath = path.join(process.cwd(), 'output', 'checkbooks', filename);
      
      // Check if file exists
      if (!fs.existsSync(filepath)) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      // Send file
      res.download(filepath, filename, (error) => {
        if (error) {
          console.error('Error downloading file:', error);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to download file' });
          }
        }
      });
    } catch (error) {
      console.error('Error in downloadPDF:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to process download request' });
      }
    }
  }
}

