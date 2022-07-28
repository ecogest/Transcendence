import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from '../game/game.gateway';
import { GameGatewayService } from '../game/game-gateway.service';
import { MatchmakingGateway } from './matchmaking.gateway';
import { GameCoreService } from 'src/pong/service/game-core/game-core.service';
import { MatchmakingGatewayService } from './matchmaking-gateway.service';

describe('MatchmakingGatewayService', () => {
  let service: MatchmakingGatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchmakingGatewayService,
        GameGateway,
        MatchmakingGateway,
        GameGatewayService,
        GameCoreService,
      ],
      imports: [JwtModule],
    }).compile();

    service = module.get<MatchmakingGatewayService>(MatchmakingGatewayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});