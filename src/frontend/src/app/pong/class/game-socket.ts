import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { NotificationService } from 'src/app/home-page/services/notification.service';
import { WaitService } from 'src/app/pong/matchmaking/wait/wait.service';
import { environment } from 'src/environments/environment';
import { GameService } from '../game/game.service';
import { InviteService } from '../matchmaking/invite/invite.service';
import { MatchmakingService } from '../matchmaking/matchmaking.service';
import { Ball } from './ball';
import { CustomGame } from './game-mode/custom-game';
import { NormalGame } from './game-mode/normal-game';
import { Player } from './player';
import { StopWatch } from './stop-watch';

@Injectable({
  providedIn: 'root',
})
export class GameSocket extends Socket {
  constructor(public waitService: WaitService) {
    super({
      url: environment.backend,
      options: {
        autoConnect: false,
        path: environment.socketGamePath,
        transports: ['websocket', 'polling'],
      },
    });
  }

  onMatchFound(
    notificationService: NotificationService,
    gameService: GameService,
    matchmakingService: MatchmakingService,
    stopWatch: StopWatch,
  ) {
    this.on(
      'matchFound',
      (
        gameType: string,
        gameMapInfo: any,
        playersInfo: any,
        reconnection: any,
      ) => {
        matchmakingService.requestLeaveMatchmaking();
        if (reconnection.reconnectionBool == false)
          notificationService.gameFound();
        this.waitService.closeWait();
        stopWatch.clearTimer();
        const playerOne: Player = new Player(
          playersInfo.height,
          playersInfo.width,
          playersInfo.playerOneColor,
          playersInfo.playerOneUsername,
        );
        const playerTwo: Player = new Player(
          playersInfo.height,
          playersInfo.width,
          playersInfo.playerTwoColor,
          playersInfo.playerTwoUsername,
        );
        const ball: Ball = new Ball(
          gameMapInfo.ballRadius,
          gameMapInfo.ballColor,
        );
        gameService.isInGame.next(true);
        if (gameType === 'normal' || gameType === 'ranked') {
          matchmakingService.game = new NormalGame(
            gameMapInfo.canvaHeight,
            gameMapInfo.canvaWidth,
            gameMapInfo.backgroundColor,
            [playerOne, playerTwo],
            ball,
            gameService,
          );
        } else if (gameType === 'custom') {
          matchmakingService.game = new CustomGame(
            gameMapInfo.canvaHeight,
            gameMapInfo.canvaWidth,
            gameMapInfo.backgroundColor,
            [playerOne, playerTwo],
            ball,
            gameService,
          );
        }
      },
    );
  }

  oninvitationAccepted(inviteService: InviteService) {
    this.on('invitationAccepted', (friendUsername: string) => {
      inviteService.openInvite(friendUsername);
    });
  }

  onWaitingForAMatch(stopWatch: StopWatch) {
    this.once('waitingForAMatch', () => {
      stopWatch.startTimer();
    });
  }

  onGameFinished(gameService: GameService) {
    this.once('gameFinished', (winner: any, leaver?: any) => {
      clearInterval(gameService.keyEventsInterval);
      gameService.isInGame.next(false);
      if (leaver != null && leaver != undefined)
        console.log(`Player ${leaver.username} has left the game`);
      console.log(winner.username + ' has won the game');
    });
  }

  onSpectatedGame(
    gameService: GameService,
    matchmakingService: MatchmakingService,
  ) {
    this.once(
      'spectatedGame',
      (gameType: string, gameMapInfo: any, playersInfo: any) => {
        const playerOne: Player = new Player(
          playersInfo.height,
          playersInfo.width,
          playersInfo.playerOneColor,
          playersInfo.playerOneUsername,
        );
        const playerTwo: Player = new Player(
          playersInfo.height,
          playersInfo.width,
          playersInfo.playerTwoColor,
          playersInfo.playerTwoUsername,
        );
        const ball: Ball = new Ball(
          gameMapInfo.ballRadius,
          gameMapInfo.ballColor,
        );
        gameService.isInGame.next(true);
        if (gameType === 'normal' || gameType === 'ranked') {
          matchmakingService.game = new NormalGame(
            gameMapInfo.canvaHeight,
            gameMapInfo.canvaWidth,
            gameMapInfo.backgroundColor,
            [playerOne, playerTwo],
            ball,
            gameService,
          );
        } else if (gameType === 'custom') {
          matchmakingService.game = new CustomGame(
            gameMapInfo.canvaHeight,
            gameMapInfo.canvaWidth,
            gameMapInfo.backgroundColor,
            [playerOne, playerTwo],
            ball,
            gameService,
          );
        }
      },
    );
  }
}
