import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { Ball } from 'src/pong/class/ball/ball';
import { GameMap } from 'src/pong/class/game-map/game-map';
import { Player } from 'src/pong/class/player/player';
import { Room } from 'src/pong/class/room/room';
import { GameGatewayService } from 'src/pong/gateway/game/game-gateway.service';
import { GameDbService } from '../game-db/game-db.service';

@Injectable()
export class GameCoreService {
  constructor(
    private gameGatewayService: GameGatewayService, private gameDbService: GameDbService
  ) {}

  gameFinished(server: Server, gameRoomUuid: string, winner: Player, loser: Player, gameLeft: boolean){
    this.gameDbService.pushGameDb(winner, loser);
    if (gameLeft === false){
      this.gameGatewayService.emitGameFinished(
        server,
        gameRoomUuid,
        winner.username,
      );
    }
    else if (gameLeft === true){
      this.gameGatewayService.emitGameFinished(
        server,
        gameRoomUuid,
        winner.username,
        loser.username
      );
    }
  }

  private playersMovement(players: Player[]) {
    if (players[0].checkBorderCollision()) {
      players[0].velocity = 0;
    }
    if (players[1].checkBorderCollision()) {
      players[1].velocity = 0;
    }
    players[0].y += players[0].velocity * players[0].speed;
    players[1].y += players[1].velocity * players[1].speed;
  }

  private ballMovement(ball: Ball, players: Player[]) {
    if (ball.checkBorderCollision()) {
      if (ball.yVelocity == -1) ball.yVelocity = 1;
      else if (ball.yVelocity == 1) ball.yVelocity = -1;
    }
    if (ball.checkPaddleCollision(players)) {
      if (ball.xVelocity == -1) ball.xVelocity = 1;
      else if (ball.xVelocity == 1) ball.xVelocity = -1;
      ball.speed += 0.1;
    }
    ball.x += ball.xVelocity * ball.speed;
    ball.y += ball.yVelocity * ball.speed;
  }

  private checkWinner(
    server: Server,
    players: Player[],
    gameRoomUuid: string,
  ): boolean {
    if (players[0].goals == 11) {
      this.gameFinished(server, gameRoomUuid, players[0], players[1], false);
      return true;
    } else if (players[1].goals == 11) {
      this.gameFinished(server, gameRoomUuid, players[1], players[0], false)
      return true;
    }
    return false;
  }

  private checkGoal(ball: Ball, gameMap: GameMap, players: Player[]): Player {
    if (ball.xVelocity == -1 && ball.x + ball.radius <= 0) return players[1];
    else if (ball.xVelocity == 1 && ball.x - ball.radius >= gameMap.canvaWidth)
      return players[0];
    return;
  }

  gameLoop(gameRoom: Room, rooms: Room[], server: Server) {
    let scorer: Player;

    setTimeout(() => {
      gameRoom.ball.xVelocity = Math.round(Math.random()) * 2 - 1;
      gameRoom.ball.yVelocity = Math.round(Math.random()) * 2 - 1;
    }, 3000);

    const interval = setInterval(() => {
      this.playersMovement(gameRoom.players);
      this.ballMovement(gameRoom.ball, gameRoom.players);
      if (
        (scorer = this.checkGoal(
          gameRoom.ball,
          gameRoom.gameMap,
          gameRoom.players,
        )) != undefined
      ) {
        scorer.goals++;
        gameRoom.ball.resetBall(gameRoom.gameMap);
      }
      if (this.checkWinner(server, gameRoom.players, gameRoom.uuid) == true) {
        this.gameGatewayService.clearRoom(gameRoom, rooms);
        clearInterval(interval);
      }
      this.gameGatewayService.emitGameUpdate(server, gameRoom, gameRoom.ball);
    }, 5);
    return interval;
  }
}
