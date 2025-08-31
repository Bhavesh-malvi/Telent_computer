import express from 'express';
import dashboardController from '../Controllers/dashboardController.js';
const router = express.Router();

router.get('/monthly-enrollments', dashboardController.getMonthlyEnrollments);
router.get('/course-demand', dashboardController.getCourseDemand);
router.get('/monthly-fee-revenue', dashboardController.getMonthlyFeeRevenue);
router.get('/todays-payments', dashboardController.getTodaysPayments);
router.get('/pending-installments', dashboardController.getPendingInstallments);
router.get('/available-filters', dashboardController.getAvailableFilters);


export default router;