// @vitest-environment jsdom

/**
 * The gate is the product, so the claim "it cannot be bypassed" is tested
 * rather than asserted in a comment.
 *
 * These drive the real page component — the real registry, the real
 * simulators, the real state machine. jsdom has no 2D canvas context, which is
 * fine: SimCanvas draws nothing and everything else behaves exactly as it does
 * in a browser.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import Home from "./page";

function runButton() {
  return screen.getByRole("button", { name: /run it|run again|locked/i });
}

function commitButton() {
  return screen.getByRole("button", { name: /commit prediction|answer everything/i });
}

/** Fill in every prediction field for whichever sim is showing. */
function fillPrediction(rationale = "because the air pushes back on it the whole way") {
  for (const input of screen.queryAllByRole("spinbutton")) {
    fireEvent.change(input, { target: { value: "42" } });
  }
  const radios = screen.queryAllByRole("radio");
  const seen = new Set<string>();
  for (const r of radios) {
    const name = (r as HTMLInputElement).name;
    if (seen.has(name)) continue;
    seen.add(name);
    fireEvent.click(r);
  }
  fireEvent.change(screen.getByLabelText(/why\?/i), { target: { value: rationale } });
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(cleanup);

describe("the gate is closed on arrival", () => {
  it("locks the run button", () => {
    render(<Home />);
    const btn = runButton();
    expect(btn).toBeDisabled();
    expect(btn.textContent).toMatch(/locked/i);
  });

  it("shows the setup, not the outcome", () => {
    render(<Home />);
    expect(screen.getByText(/the setup — not running yet/i)).toBeTruthy();
    expect(screen.queryByText(/what the simulator computed/i)).toBeNull();
  });

  it("does not reveal any computed result before a prediction", () => {
    render(<Home />);
    // The projectile lands at 95.09 m by default. That number must not be
    // anywhere on the page yet, in any rounding.
    expect(document.body.textContent).not.toMatch(/95\.0/);
    expect(screen.queryByText(/what you said, and what happened/i)).toBeNull();
  });
});

describe("committing requires an actual commitment", () => {
  it("keeps the commit button disabled until every field is answered", () => {
    render(<Home />);
    expect(commitButton()).toBeDisabled();

    fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "60" } });
    expect(commitButton()).toBeDisabled();

    fireEvent.click(screen.getAllByRole("radio")[0]);
    expect(commitButton()).toBeDisabled();
  });

  it("rejects a one-word rationale", () => {
    render(<Home />);
    fillPrediction("dunno");
    expect(commitButton()).toBeDisabled();
  });

  it("unlocks once the numeric, the choice and a real rationale are all there", () => {
    render(<Home />);
    fillPrediction();
    expect(commitButton()).not.toBeDisabled();
  });
});

describe("commit unlocks the run, and only the run", () => {
  it("enables the run button after committing", () => {
    render(<Home />);
    fillPrediction();
    fireEvent.click(commitButton());

    expect(screen.getByText(/prediction committed/i)).toBeTruthy();
    const btn = runButton();
    expect(btn).not.toBeDisabled();
    expect(btn.textContent).toMatch(/run it/i);
  });

  it("still does not show the outcome until the run has actually finished", () => {
    render(<Home />);
    fillPrediction();
    fireEvent.click(commitButton());
    expect(screen.queryByText(/what the simulator computed/i)).toBeNull();
  });
});

describe("changing the setup voids the prediction", () => {
  it("re-locks the run button when a parameter moves", () => {
    render(<Home />);
    fillPrediction();
    fireEvent.click(commitButton());
    expect(runButton()).not.toBeDisabled();

    const sliders = screen.getAllByRole("slider");
    fireEvent.change(sliders[0], { target: { value: "55" } });

    const btn = runButton();
    expect(btn).toBeDisabled();
    expect(btn.textContent).toMatch(/locked/i);
  });

  it("re-locks when an idealisation is toggled", () => {
    render(<Home />);
    fillPrediction();
    fireEvent.click(commitButton());

    const toggle = screen.getByRole("checkbox");
    fireEvent.click(toggle);

    expect(runButton()).toBeDisabled();
  });

  it("re-locks when a preset is applied", () => {
    render(<Home />);
    fillPrediction();
    fireEvent.click(commitButton());

    fireEvent.click(screen.getByRole("button", { name: /on the moon/i }));
    expect(runButton()).toBeDisabled();
  });

  it("re-locks when the simulation is switched", () => {
    render(<Home />);
    fillPrediction();
    fireEvent.click(commitButton());

    fireEvent.click(screen.getByRole("button", { name: /simple pendulum/i }));
    expect(runButton()).toBeDisabled();
  });

  it("clears the draft so the previous answer cannot ride along", () => {
    render(<Home />);
    fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "77" } });
    fireEvent.click(screen.getByRole("button", { name: /simple pendulum/i }));
    const fresh = screen.getAllByRole("spinbutton")[0] as HTMLInputElement;
    expect(fresh.value).toBe("");
  });
});

describe("every simulator puts its own questions behind the gate", () => {
  const titles = [
    /projectile launch/i,
    /two objects dropped together/i,
    /simple pendulum/i,
    /head-on collision/i,
    /block on a ramp/i,
  ];

  for (const title of titles) {
    it(String(title) + " starts locked and can be committed", () => {
      render(<Home />);
      fireEvent.click(screen.getByRole("button", { name: title }));

      expect(runButton()).toBeDisabled();
      const gate = screen.getByText(/before you can run it/i).closest("section")!;
      // Every sim declares at least one prompt, and they are all in the gate.
      expect(within(gate).getAllByRole("radio").length).toBeGreaterThan(0);

      fillPrediction();
      fireEvent.click(commitButton());
      expect(runButton()).not.toBeDisabled();
    });
  }
});

describe("the Gate 1 instrument", () => {
  it("starts empty", () => {
    render(<Home />);
    const panel = screen.getByText(/gate 1 instrument/i).closest("section")!;
    expect(within(panel).getByText("logged").nextElementSibling?.textContent).toBe("0");
  });
});
