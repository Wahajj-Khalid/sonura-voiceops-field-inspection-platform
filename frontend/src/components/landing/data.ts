export interface ChecklistSpecimenItem {
  item_id: string;
  question: string;
  response: string;
  flagged: boolean;
  status: "completed" | "pending";
}

export interface SpecimenReport {
  certificate_id: string;
  unit_id: string;
  inspector_id: string;
  compliance_officer: string;
  timestamp: string;
  overall_status: string;
  status: string;
  pass_rate: string;
  risk_level: string;
  executive_summary: string;
  ai_summary: string;
  verified_items: ChecklistSpecimenItem[];
}

export const SAMPLE_TEMPLATE_SPECIMEN: SpecimenReport = {
  certificate_id: "CERT-SAMPLE-SPECIMEN-01",
  unit_id: "BUILDING-4B-CHILLER",
  inspector_id: "OPERATOR-01",
  compliance_officer: "OPERATOR-01",
  timestamp: new Date().toISOString(),
  overall_status: "approved",
  status: "approved",
  pass_rate: "100%",
  risk_level: "LOW RISK",
  executive_summary: "Compressor head pressure verified at 42 PSI within manufacturer tolerances. High pressure relief safety valve inspected with zero residue or weeping. Unit cleared for operational duty.",
  ai_summary: "Compressor head pressure verified at 42 PSI within manufacturer tolerances. High pressure relief safety valve inspected with zero residue or weeping. Unit cleared for operational duty.",
  verified_items: [
    {
      item_id: "CHK-01",
      question: "Measure compressor head suction pressure",
      response: "Head pressure stable at 42 PSI",
      flagged: false,
      status: "completed",
    },
    {
      item_id: "CHK-02",
      question: "Check high pressure relief safety valve",
      response: "Valve seat inspected. Zero residue or weeping",
      flagged: false,
      status: "completed",
    },
    {
      item_id: "CHK-03",
      question: "Verify primary refrigerant coolant level",
      response: "Sight glass confirms full charge",
      flagged: false,
      status: "completed",
    },
    {
      item_id: "CHK-04",
      question: "Inspect intake filter and airflow baffle",
      response: "Clean airflow. No particulate obstruction",
      flagged: false,
      status: "completed",
    },
  ],
};

export const FLEET_SCALE_OPTIONS = [
  { value: "1-10", label: "1 to 10 Site Units" },
  { value: "10-50", label: "10 to 50 Equipment Facilities" },
  { value: "50+", label: "50+ Critical Infrastructure Sites" },
];