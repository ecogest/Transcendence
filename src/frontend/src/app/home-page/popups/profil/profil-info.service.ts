import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { AvatarService } from 'src/app/avatar/avatar.service';
import { environment } from 'src/environments/environment';
import { Game } from '../../interfaces/game.interface';
import { WinHistory } from '../../interfaces/win-history.interface';
import { LoseHistory } from '../../interfaces/lose-history.interface';

@Injectable({
  providedIn: 'root',
})
export class ProfilInfoService implements OnInit {
  username = '';
  nbGames = 0;
  nbWins = 0;
  nbLoses = 0;
  score = 0;
  winStreak = 0;
  loseStreak = 0;
  winHistory: Array<Game> = [];
  loseHistory: Array<Game> = [];
  gameHistory: Array<Game> = [];

  constructor(private http: HttpClient, public avatar: AvatarService) {
    //
  }

  ngOnInit() {
    //
  }

  //Find the biggest span of consecutives games
  findBiggestSpan(username: string, history: Array<Game>): number {
    let biggestSpan = 0;
    let actualSpan = 1;
    if (history.length == 0 || history.length == 1)
      return history.length == 0 ? 0 : 1;
    for (let i = 1; i < history.length; i++) {
      if (history[i - 1].id === history[i].id - 1 && actualSpan === 1)
        actualSpan = 2;
      else if (history[i - 1].id === history[i].id - 1 && actualSpan != 1)
        actualSpan++;
      else if (history[i - 1].id != history[i].id - 1 && actualSpan != 1) {
        if (actualSpan > biggestSpan) biggestSpan = actualSpan;
        actualSpan = 1;
      }
    }
    return actualSpan > biggestSpan ? actualSpan : biggestSpan;
  }

  //Retrieve from DB the winHistory of the player.
  async retrieveWonGames(username: string): Promise<Array<Game>> {
    const winHistory: Array<Game> = [];
    return new Promise((resolve) => {
      this.http
        .get<WinHistory>(
          `${environment.backend}/game/wins?username=` + username,
        )
        .subscribe((data) => {
          data.wins.forEach((val) => winHistory.push(Object.assign({}, val)));
          resolve(winHistory);
        });
    });
  }

  //Retrieve from DB the loseHistory of the player.
  async retrieveLostGames(username: string): Promise<Array<Game>> {
    const loseHistory: Array<Game> = [];
    return new Promise((resolve) => {
      this.http
        .get<LoseHistory>(
          `${environment.backend}/game/loses?username=` + username,
        )
        .subscribe((data) => {
          data.loses.forEach((val) => loseHistory.push(Object.assign({}, val)));
          resolve(loseHistory);
        });
    });
  }

  //Concat the win and loss history in one, then sort it by id.
  async retrieveUserHistory(
    username: string,
    winHistory: Array<Game>,
    loseHistory: Array<Game>,
  ): Promise<Array<Game>> {
    const gameHistory = winHistory.concat(loseHistory);
    return new Promise((resolve) => {
      gameHistory.sort((n1, n2) => {
        if (n1.id > n2.id) {
          return 1;
        }
        if (n1.id < n2.id) {
          return -1;
        }
        return 0;
      });
      resolve(gameHistory);
    });
  }

  //Retrieve the number of won games
  retrieveWinCounter(username: string, winHistory: Array<Game>) {
    return winHistory.filter((x) => x.type === 'ranked').length;
  }

  //Retrieve the number of lost games
  retrieveLoseCounter(username: string, loseHistory: Array<Game>) {
    return loseHistory.filter((x) => x.type === 'ranked').length;
  }

  //Retrive the number of played games
  retrieveGameCounter(nbWins: number, nbLoses: number) {
    return nbWins + nbLoses;
  }

  //Calculate the score based on the win/lose ratio.
  retrieveScore(nbWins: number, nbLoses: number) {
    if (nbWins === 0 && nbLoses === 0) return 0;
    else if (nbWins != 0 && nbLoses === 0) return nbWins * 350;
    else return Math.round((nbWins / nbLoses) * 1000);
  }

  //Retrieve the biggest win streak
  retrieveWinStreak(username: string, winHistory: Array<Game>) {
    return this.findBiggestSpan(
      username,
      winHistory.filter((x) => x.type === 'ranked'),
    );
  }

  //Retrieve the biggest lose streak
  retrieveLoseStreak(username: string, loseHistory: Array<Game>) {
    return this.findBiggestSpan(
      username,
      loseHistory.filter((x) => x.type === 'ranked'),
    );
  }

  //Load the profil of a registred user.
  async loadUserProfil(username: string) {
    this.username = username;
    this.winHistory = await this.retrieveWonGames(username);
    this.loseHistory = await this.retrieveLostGames(username);
    this.gameHistory = await this.retrieveUserHistory(
      username,
      this.winHistory,
      this.loseHistory,
    );
    this.winStreak = this.retrieveWinStreak(username, this.winHistory);
    this.loseStreak = this.retrieveLoseStreak(username, this.loseHistory);
    this.nbWins = this.retrieveWinCounter(username, this.winHistory);
    this.nbLoses = this.retrieveLoseCounter(username, this.loseHistory);
    this.nbGames = this.retrieveGameCounter(this.nbWins, this.nbLoses);
    this.score = this.retrieveScore(this.nbWins, this.nbLoses);
  }
}
