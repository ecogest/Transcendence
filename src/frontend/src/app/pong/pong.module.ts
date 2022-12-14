import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameComponent } from './game/game.component';
import { GameService } from './game/game.service';
import { MatchmakingService } from './matchmaking/matchmaking.service';
import { MatchmakingComponent } from './matchmaking/matchmaking.component';
import { GameSocket } from './class/game-socket';
import { AvatarModule } from '../avatar';
import { InviteComponent } from './matchmaking/invite/invite.component';
import { WaitComponent } from './matchmaking/wait/wait.component';

@NgModule({
  declarations: [
    MatchmakingComponent,
    InviteComponent,
    WaitComponent,
    GameComponent,
  ],
  imports: [CommonModule, AvatarModule],
  providers: [GameService, MatchmakingService, GameComponent, GameSocket],
  exports: [MatchmakingComponent, GameComponent],
})
export class PongModule {}
