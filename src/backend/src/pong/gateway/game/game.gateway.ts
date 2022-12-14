import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Room } from '../../class/room/room';
import { GameGatewayService } from './game-gateway.service';
import { Player } from '../../class/player/player';
import { GameCoreService } from 'src/pong/service/game-core/game-core.service';
import { MatchmakingGatewayService } from '../matchmaking/matchmaking-gateway.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: true, path: '/pong' })
@Injectable()
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private gameGatewayService: GameGatewayService,
    private gameCoreService: GameCoreService,
    @Inject(forwardRef(() => MatchmakingGatewayService))
    private matchmakingService: MatchmakingGatewayService,
    private jwtService: JwtService,
  ) {
    this.logger = new Logger('GameGateway');
    this._rooms = [];
    this._users = [];
  }

  @WebSocketServer()
  private _server: Server;
  private _rooms: Room[];
  private _users: Socket[];

  private logger: Logger;

  afterInit() {
    this.logger.log('Init');
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    if (this.gameGatewayService.checkJwtToken(client)) {
      this._users.push(client);
      this.logger.log(`Client connected: ${client.id}`);
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    if (this.matchmakingService.isClientInMatchmaking(client))
      this.matchmakingService.clientLeaveMatchmaking(client);
    this._users.splice(
      this._users.findIndex((element) => element === client),
      1,
    );
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('move')
  movement(@ConnectedSocket() client: Socket, @MessageBody() eventKey: string) {
    if (this.matchmakingService.isClientInGame(client) === false) return;
    try {
      const gameRoom: Room = this.gameGatewayService.findRoomId(
        this.rooms,
        JSON.parse(
          JSON.stringify(this.jwtService.decode(client.handshake.auth.token)),
        ).username,
      );
      const player: Player = this.gameGatewayService.findPlayer(
        gameRoom,
        client,
      );
      gameRoom.gameMode.movementHandler(eventKey, player);
    } catch (error) {
      this.logger.debug(error);
    }
  }

  @SubscribeMessage('leaveGame')
  leaveGame(@ConnectedSocket() client: Socket) {
    let winner: Player;
    let leaver: Player;

    for (const room of this.rooms) {
      for (const player of room.players) {
        if (
          player.socket.handshake.auth.token === client.handshake.auth.token
        ) {
          winner = room.players.find(
            (element) =>
              element.socket.handshake.auth.token !=
              client.handshake.auth.token,
          );
          leaver = room.players.find(
            (element) =>
              element.socket.handshake.auth.token ==
              client.handshake.auth.token,
          );
          this.gameCoreService.gameFinished(
            this.server,
            room,
            this.rooms,
            winner,
            leaver,
            true,
          );
          this.logger.log(
            `player ${leaver.username} has left the game ${room.uuid}`,
          );
          return;
        }
      }
    }
  }

  @SubscribeMessage('spectateGame')
  spectateGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() username: string,
  ) {
    if (this.matchmakingService.isUserInGame(username) === false) return;
    try {
      const gameRoom: Room = this.gameGatewayService.findRoomId(
        this.rooms,
        username,
      );
      client.join(gameRoom.uuid);
      this.gameGatewayService.emitSpectatedGame(this.server, gameRoom);
    } catch (error) {
      this.logger.debug(error);
    }
  }

  @SubscribeMessage('acceptPrivateInvitation')
  acceptPrivateInvitation(
    @ConnectedSocket() client: Socket,
    @MessageBody() friendUsername: string,
  ) {
    this.logger.log(
      'acceptPrivateInvitation; ' +
        client.id +
        ' friendusername: ' +
        friendUsername,
    );
    try {
      const friend: Socket = this._users.find(
        (element) =>
          JSON.parse(
            JSON.stringify(
              this.jwtService.decode(element.handshake.auth.token),
            ),
          ).username === friendUsername,
      );
      friend.emit(
        'invitationAccepted',
        JSON.parse(
          JSON.stringify(this.jwtService.decode(client.handshake.auth.token)),
        ).username,
      );
    } catch (error) {
      this.logger.debug(error);
    }
  }

  @SubscribeMessage('choosePrivateMode')
  choosePrivateMode(
    @ConnectedSocket() client: Socket,
    @MessageBody() infos: string[],
  ) {
    try {
      const friend: Socket = this._users.find(
        (element) =>
          JSON.parse(
            JSON.stringify(
              this.jwtService.decode(element.handshake.auth.token),
            ),
          ).username === infos[0],
      );
      const players: Socket[] = [friend, client];
      this.matchmakingService.createGame(players, infos[1]);
    } catch (error) {
      this.logger.debug(error);
    }
  }

  @SubscribeMessage('gameReconnection')
  gameReconnction(
    @ConnectedSocket() client: Socket,
    @MessageBody() username: string,
  ) {
    if (this.matchmakingService.isUserInGame(username) === false) return;
    try {
      const gameRoom: Room = this.gameGatewayService.findRoomId(
        this.rooms,
        username,
      );
      gameRoom.players[
        gameRoom.players.findIndex((element) => element.username === username)
      ].socket = client;
      client.join(gameRoom.uuid);
      this.gameGatewayService.emitMatchFound(this._server, gameRoom, true);
    } catch (error) {
      this.logger.debug(error);
    }
  }

  get rooms(): Room[] {
    return this._rooms;
  }

  get server(): Server {
    return this._server;
  }
}
