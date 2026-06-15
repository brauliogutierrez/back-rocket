import { PlayerState, PlayerInput } from "../types";

export class Player {
  public id: string;
  public name: string;
  public x: number;
  public y: number;
  public rotation: number;
  public vx: number;
  public vy: number;
  public isAlive: boolean;
  public selectedShip?: string;
  public lives: number;
  public finished: boolean;

  constructor(id: string, name?: string, selectedShip?: string) {
    this.id = id;
    this.name = name || `Jugador ${id.substring(0, 4)}`;
    this.x = 0;
    this.y = 0;
    this.rotation = 0;
    this.vx = 0;
    this.vy = 0;
    this.isAlive = true;
    this.selectedShip = selectedShip;
    this.lives = 1;
    this.finished = false;
  }

  public applyInput(input: PlayerInput): void {
    // Client authoritative: we trust the client's position for now.
    // In a stricter authoritative server, we would only accept thrust/turn inputs and calculate physics here.
    this.x = input.x;
    this.y = input.y;
    this.rotation = input.rotation;
    this.vx = input.vx;
    this.vy = input.vy;
  }

  public die(): void {
    this.isAlive = false;
    this.lives = 0;
  }

  public finish(): void {
    this.finished = true;
    this.isAlive = false;
  }

  public getState(): PlayerState {
    return {
      id: this.id,
      name: this.name,
      x: this.x,
      y: this.y,
      rotation: this.rotation,
      vx: this.vx,
      vy: this.vy,
      isAlive: this.isAlive,
      selectedShip: this.selectedShip,
      lives: this.lives,
      finished: this.finished,
    };
  }
}
