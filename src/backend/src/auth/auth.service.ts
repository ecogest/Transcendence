import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as argon from 'argon2';
import { DbErrorCode } from 'src/db/db.errors';
import { DbService } from 'src/db/db.service';
import { UsernameSigninDto, EmailSignupDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(private db: DbService, private jwt: JwtService) {}

  async signup(dto: EmailSignupDto) {
    const pwdHash = await argon.hash(dto.password);
    try {
      await this.db.user.create({
        data: {
          username: dto.username,
          email: dto.email,
          password: pwdHash,
        },
      });
      this.logger.log(`New user '${dto.username}' successfully signed up!`);
      return { message: `${dto.username} successfully signed up!` };
    } catch (err) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code == DbErrorCode.UniqueConstraintFailed
      )
        throw new ForbiddenException('User already exists');
      else throw err;
    }
  }

  async signin(
    dto: UsernameSigninDto,
  ): Promise<{ message: string; jwt: string }> {
    const user = await this.db.user.findUnique({
      where: { username: dto.username },
    });
    if (user && (await argon.verify(user.password, dto.password))) {
      this.logger.log(`User '${dto.username}' successfully signed in!`);
      return {
        message: `${user.username} successfully signed in!`,
        jwt: await this.signToken(user.id, user.username),
      };
    } else throw new ForbiddenException('Credentials incorrect');
  }

  signout(dto: EmailSignupDto) {
    // TODO
    return { message: `${dto.username} Successfully signed out!` };
  }

  private signToken(userId: number, username: string): Promise<string> {
    const payload = {
      sub: userId,
      username: username,
    };
    return this.jwt.signAsync(payload, {
      expiresIn: '42m',
      secret: process.env['JWT_SECRET'],
    });
  }
}
