import { Injectable, Logger } from '@nestjs/common';
import { ConnectedSocket } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { CustomGame } from 'src/pong/class/game-mode/custom-game/custom-game';
import { GameMode } from 'src/pong/interface/game-mode.interface';
import { JwtAuthService } from 'src/auth/modules/jwt/jwt-auth.service';
import { Player } from '../../class/player/player';
import { Room } from '../../class/room/room';

@Injectable()
export class GameGatewayService {
  constructor(private jwtService: JwtAuthService) {
    this.logger = new Logger('GameGateway');
  }

  private logger: Logger;

  findRoomId(rooms: Room[], username: string): Room {
    for (const room of rooms) {
      for (const player of room.players) {
        if (player.username === username) return room;
      }
    }
    return;
  }

  findPlayer(room: Room, client: Socket): Player {
    for (const player of room.players) {
      if (player.socket === client) return player;
    }
    return;
  }

  clearRoom(roomToClear: Room, rooms: Room[]) {
    roomToClear.players[0].socket.leave(roomToClear.uuid);
    roomToClear.players[1].socket.leave(roomToClear.uuid);
    rooms.splice(
      rooms.findIndex((element) => element === roomToClear),
      1,
    );
  }

  checkJwtToken(@ConnectedSocket() client: Socket): boolean {
    try {
      this.jwtService.verifyAccessToken(client.handshake.auth.token, 'sync');
      return true;
    } catch (error) {
      this.logger.debug(error);
      client.disconnect();
    }
  }

  emitGameFinished(
    server: Server,
    roomUuid: string,
    winner: string,
    leaver?: string,
  ) {
    if (leaver != undefined)
      server
        .to(roomUuid)
        .emit('gameFinished', { username: winner }, { username: leaver });
    else server.to(roomUuid).emit('gameFinished', { username: winner });
  }

  private getGameMode(game: GameMode): string {
    if (game.gameType === 'normal') return 'normal';
    else if (game instanceof CustomGame) return 'custom';
    return 'ranked';
  }

  emitMatchFound(server: Server, newRoom: Room, reconnection: boolean) {
    server.to(newRoom.uuid).emit(
      'matchFound',
      this.getGameMode(newRoom.gameMode),
      {
        canvaHeight: newRoom.gameMode.canvaHeight,
        canvaWidth: newRoom.gameMode.canvaWidth,
        backgroundColor: newRoom.gameMode.backgroundColor,
        ballRadius: newRoom.gameMode.ball.radius,
        ballColor: newRoom.gameMode.ball.color,
      },
      {
        height: newRoom.players[0].height,
        width: newRoom.players[0].width,
        playerOneColor: newRoom.players[0].color,
        playerTwoColor: newRoom.players[1].color,
        playerOneUsername: newRoom.players[0].username,
        playerTwoUsername: newRoom.players[1].username,
      },
      {
        reconnectionBool: reconnection,
      },
    );
  }

  emitSpectatedGame(server: Server, newRoom: Room) {
    server.to(newRoom.uuid).emit(
      'spectatedGame',
      this.getGameMode(newRoom.gameMode),
      {
        canvaHeight: newRoom.gameMode.canvaHeight,
        canvaWidth: newRoom.gameMode.canvaWidth,
        backgroundColor: newRoom.gameMode.backgroundColor,
        ballRadius: newRoom.gameMode.ball.radius,
        ballColor: newRoom.gameMode.ball.color,
      },
      {
        height: newRoom.players[0].height,
        width: newRoom.players[0].width,
        playerOneColor: newRoom.players[0].color,
        playerTwoColor: newRoom.players[1].color,
        playerOneUsername: newRoom.players[0].username,
        playerTwoUsername: newRoom.players[1].username,
      },
    );
  }
}
