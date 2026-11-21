import { describe, expect, it } from "vitest";
import {
  computeRadialSeatPosition,
  findHitRegionAtPoint,
  lerp,
  lerpHexColor,
  ParticleSystem,
  type HitRegion,
} from "@/canvas/engine";

describe("2D Canvas Scene Engine Primitives", () => {
  it("interpolates numbers and hex colors smoothly for Day/Night transitions", () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
    expect(lerpHexColor("#000000", "#ffffff", 0.5)).toBe("#808080");
  });

  it("places Seats radially around the center table starting from the top", () => {
    const top = computeRadialSeatPosition(0, 4, 500, 400, 180, 140);
    expect(Math.round(top.x)).toBe(500);
    expect(Math.round(top.y)).toBe(260);

    const bottom = computeRadialSeatPosition(2, 4, 500, 400, 180, 140);
    expect(Math.round(bottom.x)).toBe(500);
    expect(Math.round(bottom.y)).toBe(540);
  });

  it("resolves pointer hit-testing for circular Seat targets and rectangular Role Cards", () => {
    const regions: HitRegion[] = [
      {
        id: "seat-1",
        shape: "circle",
        x: 200,
        y: 200,
        radius: 36,
        data: { seatNo: 1 },
      },
      {
        id: "role-card",
        shape: "rect",
        x: 20,
        y: 500,
        width: 140,
        height: 80,
        data: { toggleRole: true },
      },
    ];

    expect(findHitRegionAtPoint(regions, 210, 195)?.id).toBe("seat-1");
    expect(findHitRegionAtPoint(regions, 50, 530)?.id).toBe("role-card");
    expect(findHitRegionAtPoint(regions, 400, 400)).toBeNull();
  });

  it("updates particle positions and removes expired particles", () => {
    const sys = new ParticleSystem();
    sys.spawn({
      x: 100,
      y: 100,
      vx: 10,
      vy: -20,
      radius: 3,
      color: "#fbbf24",
      life: 0.5,
      maxLife: 1,
    });
    expect(sys.particles).toHaveLength(1);
    sys.update(0.25);
    expect(sys.particles[0].x).toBeCloseTo(102.5);
    expect(sys.particles[0].y).toBeCloseTo(95);
    sys.update(0.3);
    expect(sys.particles).toHaveLength(0);
  });
});
