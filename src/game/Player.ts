import { PlayerState, PlayerInput } from "../types";

export class Player {
  public id: string;
  public x: number;
  public y: number;
  public rotation: number;
  public vx: number;
  public vy: number;
  public isAlive: boolean;
  public selectedShip?: string;

  constructor(id: string, selectedShip?: string) {
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.rotation = 0;
    this.vx = 0;
    this.vy = 0;
    this.isAlive = true;
    this.selectedShip = selectedShip;
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
  }

  public finish(): void {
    // Handle finishing the race
  }

  public getState(): PlayerState {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      rotation: this.rotation,
      vx: this.vx,
      vy: this.vy,
      isAlive: this.isAlive,
      selectedShip: this.selectedShip,
    };
  }
}
