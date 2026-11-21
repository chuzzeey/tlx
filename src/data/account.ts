export interface OrderItem {
  productId: string;
  qty: number;
  price: number;
  size?: string;
  color?: string;
}

export interface Order {
  id: string;
  date: string;
  status: "Delivered" | "In transit" | "Processing" | "Returned";
  items: OrderItem[];
  shipping: number;
  address: string;
}

export const orders: Order[] = [
  {
    id: "AUR-1056", date: "2026-08-08", status: "Processing", shipping: 0,
    address: "Vesterbrogade 44, 3tv, 1620 Copenhagen, Denmark",
    items: [{ productId: "mwdbl-jacket", qty: 2, price: 308721, size: "M" }],
  },
  {
    id: "AUR-1053", date: "2026-08-07", status: "Processing", shipping: 0,
    address: "Vesterbrogade 44, 3tv, 1620 Copenhagen, Denmark",
    items: [{ productId: "mens-golf-cap", qty: 1, price: 64994 }],
  },
  {
    id: "TLX-T1O42", date: "2026-08-06", status: "In transit", shipping: 46037,
    address: "Lagos Mainland, Lagos, Nigeria",
    items: [
      { productId: "seashell-bag", qty: 1, price: 128634 },
      { productId: "sneakers", qty: 1, price: 162485 },
    ],
  },
  {
    id: "AUR-1037", date: "2026-07-22", status: "Delivered", shipping: 12186,
    address: "Vesterbrogade 44, 3tv, 1620 Copenhagen, Denmark",
    items: [
      { productId: "chaotic-club", qty: 1, price: 119156 },
      { productId: "mens-golf-cap", qty: 1, price: 64994 },
    ],
  },
  {
    id: "AUR-1028", date: "2026-06-14", status: "Delivered", shipping: 66348,
    address: "Vesterbrogade 44, 3tv, 1620 Copenhagen, Denmark",
    items: [{ productId: "stussy-jacket", qty: 1, price: 316845 }],
  },
  {
    id: "AUR-1011", date: "2026-05-02", status: "Delivered", shipping: 0,
    address: "Vesterbrogade 44, 3tv, 1620 Copenhagen, Denmark",
    items: [
      { productId: "mwdbl-jacket", qty: 1, price: 308721, size: "M" },
      { productId: "seashell-bag", qty: 1, price: 128634 },
    ],
  },
  {
    id: "AUR-0993", date: "2026-03-18", status: "Returned", shipping: 12186,
    address: "Vesterbrogade 44, 3tv, 1620 Copenhagen, Denmark",
    items: [{ productId: "chaotic-club", qty: 2, price: 119156 }],
  },
];

export interface Address {
  id: string;
  label: string;
  name: string;
  street: string;
  city: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export const addresses: Address[] = [
  { id: "addr-1", label: "Home", name: "Astrid Vestergaard", street: "Vesterbrogade 44, 3tv", city: "1620 Copenhagen", country: "Denmark", phone: "+45 31 44 20 18", isDefault: true },
  { id: "addr-2", label: "Studio", name: "Astrid Vestergaard", street: "Gothersgade 21, st", city: "1123 Copenhagen", country: "Denmark", phone: "+45 31 44 20 18", isDefault: false },
  { id: "addr-3", label: "Summer house", name: "Astrid & Mads Vestergaard", street: "Strandvejen 7", city: "8400 Ebeltoft", country: "Denmark", phone: "+45 28 90 11 42", isDefault: false },
];

export const accountProfile = {
  name: "Astrid Vestergaard",
  email: "astrid.vester@example.com",
  phone: "+45 31 44 20 18",
  joined: "March 2023",
  tier: "Platinum Member",
};

export function orderTotal(o: Order): number {
  return o.items.reduce((s, i) => s + i.price * i.qty, 0) + o.shipping;
}
