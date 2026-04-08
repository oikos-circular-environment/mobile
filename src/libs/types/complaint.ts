export type ComplaintStatus = "pending" | "resolved" | "canceled";

export type Complaint = {
  address: string;
  dateTime: string;
  coordinates: {
    latitude: number;
    longitude: number;
    formatted: string;
  };
  status: ComplaintStatus;
};
