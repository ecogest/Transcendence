import { forwardRef, Module } from '@nestjs/common';
import { GameGateway } from './gateway/game/game.gateway';
import { GameGatewayService } from './gateway/game/game-gateway.service';
import { MatchmakingGateway } from './gateway/matchmaking/matchmaking.gateway';
import { MatchmakingGatewayService } from './gateway/matchmaking/matchmaking-gateway.service';
import { GameCoreService } from './service/game-core/game-core.service';
import { GameDbService } from './service/game-db/game-db.service';
import { GameController } from './controller/game/game.controller';
import { DbService } from 'src/db/db.service';
import { JwtAuthModule } from 'src/auth/modules/jwt/jwt-auth.module';
import { JwtService } from '@nestjs/jwt';
import { SocialModule } from 'src/social/social.module';

@Module({
  controllers: [GameController],
  imports: [JwtAuthModule, forwardRef(() => SocialModule)],
  exports: [MatchmakingGatewayService],
  providers: [
    GameCoreService,
    GameGateway,
    GameGatewayService,
    MatchmakingGateway,
    MatchmakingGatewayService,
    GameDbService,
    GameController,
    DbService,
    GameController,
    JwtService,
  ],
})
export class PongModule {}
