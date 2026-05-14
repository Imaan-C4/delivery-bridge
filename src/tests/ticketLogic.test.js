import {
  shouldCreateDadTicket,
  getManagerForLabel,
  isDadLabelPresent,
  getChildTickets
} from '../services/ticketLogic';

// Core feature 1: Automatically generate DAD ticket when status reaches Response Issued

test('positive: returns true when status is Response Issued', () => {
  expect(shouldCreateDadTicket("Response Issued")).toBe(true);
});

test('negative: returns false when status is not Response Issued', () => {
  expect(shouldCreateDadTicket("Create Response")).toBe(false);
});

// Core feature 2: Assign DAD ticket to relevant delivery manager

test('positive: returns correct delivery manager account ID for green label', () => {
  expect(getManagerForLabel("green")).toBe(
    "712020:5922a8fa-72be-4224-9d69-c2a71a5cd3a7"
  );
});

test('negative: returns null for an unknown delivery manager label', () => {
  expect(getManagerForLabel("purple")).toBe(null);
});

// Core feature 3: Decompose DAD ticket when button is clicked

test('positive: creates Dev, Test, and System Test child ticket definitions', () => {
  expect(getChildTickets("DAD")).toEqual([
    {
      summary: "DAD Dev",
      label: "dev"
    },
    {
      summary: "DAD Test",
      label: "test"
    },
    {
      summary: "DAD System Test",
      label: "system-test"
    }
  ]);
});

test('negative: non-DAD issue label is not treated as a DAD ticket', () => {
  expect(isDadLabelPresent(["green"])).toBe(false);
});