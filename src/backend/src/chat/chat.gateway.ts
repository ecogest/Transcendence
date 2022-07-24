import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { RoomUserService } from './room-user/room-user.service';
import { RoomService } from './room/room.service';
import { MessageService } from './message/message.service';
import { Room, RoomType, User, RoomUser, Message } from '@prisma/client';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private roomService: RoomService,
    private roomUserService: RoomUserService,
    private messageService: MessageService, //private connectedUsers:   {[userId: number]: Socket}
  ) {}
  
 async handleConnection(socket: Socket) {
    console.log('client connected');
    let rooms = await this.roomService.rooms({});
    if (rooms.length > 0)
      this.server.to(socket.id).emit('rooms', rooms);
    //this.server.to(socket.id).emit('testfgh');
    //console.log(await this.roomService.rooms({}));
  }

  async handleDisconnect(socket: Socket) {

  }

  @SubscribeMessage('createRoom')
  async createRoom(
    socket: Socket,
    room: Room
  ) {
    if (room.roomType === 'PROTECTED' && !room.password) return 'Error';
    await this.roomService.createRoom({
      name: room.name,
      password: room.password,
      roomType: room.roomType,
      //users: { create: { user: { connect: owner }, role: 'OWNER' } },
    });
    // needs emit once i can find how to identify user by connection to server
    // emit new room to all connected user
    //this.server.to(socket.id).emit('rooms', this.roomService.rooms({}));
    this.getRooms(socket);
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(room: Room, user: User) {
    this.roomService.joinRoom(room, user);
    // needs emit once i can find how to identify user by connection to server
    // emmit room messages to new member of room
  }

  @SubscribeMessage('addMessage')
  async addMessage(socket: Socket, message: Message, room: Room) {
    var user: User;
    this.messageService.createMessage({
      content: message.content,
      room: { connect: room },
      user: { connect: user },
    });
    // needs emit once i can find how to identify user by connection to server
    // emmit new message to all members of the room
    await this.roomService.addMessage(room, message);
    //this.server.to(socket.id).emit('rooms', room);
    this.getRooms(socket);
  }

  @SubscribeMessage('getRooms')
  async getRooms(socket: Socket) {
    this.server.to(socket.id).emit('rooms', await this.roomService.rooms({}));
  }
}
