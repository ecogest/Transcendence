import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { Message } from 'src/app/chat/interface/message';
import { Room } from 'src/app/chat/interface/room';
import { ChatService } from 'src/app/chat/chatService/chat.service';
import { RoomUser } from 'src/app/chat/interface/roomUser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PopupsService } from 'src/app/home-page/popups/popups.service';
import { JwtService } from 'src/app/auth/jwt';
import { GameComponent } from 'src/app/pong/game/game.component';
import { SocialService } from 'src/app/home-page/popups/social/social.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.css'],
})
export class ChatRoomComponent implements OnChanges, OnInit, OnDestroy {
  @Input() chatRoom: Room = {};
  @ViewChild('mesgs') private scrollContainer: ElementRef = new ElementRef(
    'mesgs',
  );
  chatMessage: UntypedFormControl = new UntypedFormControl(null, [
    Validators.required,
  ]);
  pass: UntypedFormControl = new UntypedFormControl(null, [
    Validators.required,
  ]);
  getMsgEvent?: Subscription;
  banMuteEvent?: Subscription;
  getMsgsEvent?: Subscription;
  getRoomUsersEvent?: Subscription;
  messages: Message[] = [];
  roomUsers: RoomUser[] = [];
  username = '';

  constructor(
    private chatService: ChatService,
    private snackBar: MatSnackBar,
    public popupsService: PopupsService,
    private jwtService: JwtService,
    public gameComponent: GameComponent,
    public socialService: SocialService,
  ) {
    const tmp = this.jwtService.username;
    if (tmp != undefined) this.username = tmp;
  }

  ngOnInit(): void {
    this.getMsgEvent = this.chatService
      .getMsg()
      .subscribe((nMessage: Message) => {
        if (
          this.socialService.checkUserRelation(
            this.username,
            nMessage.username,
          ) !== 'blocked'
        )
          this.messages.push(nMessage);
      });
    this.banMuteEvent = this.chatService
      .getBanMuteResult()
      .subscribe((commandReturn) => {
        this.snackBar.open(commandReturn, 'dismiss', {
          duration: 3000,
          horizontalPosition: 'right',
        });
      });
    this.getMsgsEvent = this.chatService
      .getMsgs()
      .subscribe((msgs: Message[]) => {
        for (const message of msgs) {
          let add = true;
          for (const oldm of this.messages) {
            if (
              message.id === oldm.id ||
              this.socialService.checkUserRelation(
                this.username,
                message.username,
              ) === 'blocked'
            )
              add = false;
          }
          if (add) this.messages.push(message);
        }
      });
    this.getRoomUsersEvent = this.chatService
      .getRoomUsers()
      .subscribe((roomUsers: RoomUser[]) => {
        if (roomUsers.length !== 0) this.roomUsers = roomUsers;
      });
  }

  ngOnDestroy(): void {
    this.getMsgEvent?.unsubscribe();
    this.banMuteEvent?.unsubscribe();
    this.getMsgsEvent?.unsubscribe();
    this.getRoomUsersEvent?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['chatRoom'].previousValue !== undefined &&
      changes['chatRoom'].previousValue.name !== undefined &&
      changes['chatRoom'].previousValue.id !==
        changes['chatRoom'].currentValue.id
    ) {
      this.chatService.leaveRoom(changes['chatRoom'].previousValue);
    }
    if (this.chatRoom.id) {
      this.chatService.joinRoom(this.chatRoom);
    }
    this.messages = [];
    this.messages.length = 0;
  }

  joinProtectedRoom() {
    this.chatRoom.password = this.pass.value;
    this.chatService.joinRoom(this.chatRoom);
    this.pass.reset();
  }

  sendMessage() {
    if (!this.chatMessage.valid) {
      return;
    }
    if (this.chatMessage.value[0] === '/') {
      this.chatService.sendCommand(this.chatMessage.value, this.chatRoom);
      this.chatService.getCommandResult().then((commandReturn) => {
        this.snackBar.open(commandReturn, 'dismiss', {
          duration: 3000,
          horizontalPosition: 'right',
        });
      });
    } else {
      this.chatService.sendMessage({
        content: this.chatMessage.value,
        room: this.chatRoom,
        roomId: this.chatRoom.id,
      });
    }
    this.chatMessage.reset();
    try {
      this.scrollContainer.nativeElement.scrollTop =
        this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  openProfile(username: any) {
    if (username === undefined || username === null) return;
    this.popupsService.openProfil(username);
  }
}
