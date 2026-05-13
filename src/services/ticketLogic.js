// Returns true if issue reached Response Issued
export const shouldCreateDadTicket = (status) => {
  return status === "Response Issued";
};

// Maps colour labels to manager account IDs
export const getManagerForLabel = (label) => {
  const managerMap = {
    green: "712020:5922a8fa-72be-4224-9d69-c2a71a5cd3a7",
    blue: "712020:8fae6ecc-0929-4386-8d71-9b16162a2ae5",
    red: "712020:1064872d-7c70-430a-84da-7beebb53fd22"
  };

  return managerMap[label] || null;
};

// Returns true if issue contains DAD label
export const isDadLabelPresent = (labels) => {
  return labels.includes("DAD");
};

// Returns child ticket definitions
export const getChildTickets = (parentSummary) => {
  return [
    { suffix: "Dev", label: "dev" },
    { suffix: "Test", label: "test" },
    { suffix: "System Test", label: "system-test" }
  ].map((child) => ({
    summary: `${parentSummary} ${child.suffix}`,
    label: child.label
  }));
};