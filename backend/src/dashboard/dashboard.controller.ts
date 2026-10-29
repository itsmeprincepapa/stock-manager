import { Controller, Get } from '@nestjs/common';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../users/user.entity';
import { DashboardService } from './dashboard.service';

// Toutes les routes de ce contrôleur commencent par /dashboard.
// @Roles sur la classe : tout le tableau de bord est réservé au gérant,
// car il montre le chiffre d'affaires.
@Roles(Role.MANAGER)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // GET /dashboard : toutes les statistiques en une seule requête
  @Get()
  getStats() {
    return this.dashboardService.getStats();
  }
}