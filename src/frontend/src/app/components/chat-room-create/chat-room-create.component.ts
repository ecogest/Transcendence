import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Room } from 'src/app/interface/room';
import { RoomType } from 'src/app/interface/room';
import { ChatService } from 'src/app/services/chatService/chat.service';

@Component({
  selector: 'app-chat-room-create',
  templateUrl: './chat-room-create.component.html',
  styleUrls: ['./chat-room-create.component.css'],
})
export class ChatRoomCreateComponent /*implements OnInit*/ {
  roomTypes = Object.values(RoomType);

  constructor(
    public dialogRef: MatDialogRef<ChatRoomCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Room,
    private chatService: ChatService,
  ) {}

  //ngOnInit(): void {}

  create() {
    console.log('call create');
    this.dialogRef.close();
    console.log(this.data);
    if (
      this.data.name &&
      this.data.roomType &&
      (this.data.password || this.data.roomType != 'PROTECTED')
    ) {
      this.chatService.createRoom(this.data);
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
