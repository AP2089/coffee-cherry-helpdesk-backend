export type ChatSender = 'user' | 'agent'

export enum UserRole {
  Admin = 'admin',
  Manager = 'manager',
  Guest = 'guest',
}

export interface UserSeedEntry {
  username: string
  password: string
  role: UserRole
}

export interface IUser {
  username: string
  passwordHash: string
  role: UserRole
  createdAt?: Date
  updatedAt?: Date
}

export interface IChatMessage {
  sessionId: string
  sender: ChatSender
  text: string
  createdAt?: Date
}

export interface IConversation {
  sessionId: string
  guestName?: string
  guestEmail?: string
  status: 'open' | 'closed'
  createdAt?: Date
  updatedAt?: Date
}

export interface ChatGuestProfile {
  guestName: string
  guestEmail: string
}

export interface ChatMessageDTO {
  id: string
  sessionId: string
  sender: ChatSender
  text: string
  createdAt: string
}

export interface ConversationListItem {
  sessionId: string
  guestName: string
  guestEmail: string
  status: 'open' | 'closed'
  updatedAt: string
  lastMessage?: {
    text: string
    sender: ChatSender
    createdAt: string
  }
}

export interface PaginatedList<T> {
  items: T[]
  total: number
  hasMore: boolean
}

export interface MessagesPageResult {
  messages: ChatMessageDTO[]
  hasMore: boolean
}

export type CoffeeWeight = 250 | 500 | 1000

export interface ICoffeeLocalizedContent {
  name?: string
  country: string
  region: string
  variety?: string
  process: string
  altitude?: string
  description: string
  story: string
  flavorNotes: string[]
}

export interface ICoffeeTranslations {
  en?: ICoffeeLocalizedContent
}

export interface ICoffee {
  name: string
  slug: string
  country: string
  region: string
  variety: string
  process: string
  altitude: string
  description: string
  story: string
  flavorNotes: string[]
  price: number
  weights: CoffeeWeight[]
  image: string
  gallery: string[]
  stock: number
  translations?: ICoffeeTranslations
  createdAt?: Date
  updatedAt?: Date
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface IOrderItem {
  coffeeId: string
  slug: string
  name: string
  weight: CoffeeWeight
  quantity: number
  price: number
}

export interface ICustomer {
  name: string
  phone: string
  email: string
  city: string
  address: string
  comment?: string
}

export interface IOrder {
  items: IOrderItem[]
  customer: ICustomer
  totalPrice: number
  status: OrderStatus
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateOrderPayload {
  items: Array<{
    slug: string
    weight: CoffeeWeight
    quantity: number
  }>
  customer: ICustomer
}

export interface UpdateOrderPayload {
  status?: OrderStatus
}

export type ContactMessageStatus = 'new' | 'read' | 'archived'

export interface IContactMessage {
  name: string
  email: string
  message: string
  status: ContactMessageStatus
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateContactMessagePayload {
  name: string
  email: string
  message: string
}

export interface UpdateContactMessagePayload {
  status?: ContactMessageStatus
}

export interface UpdateCoffeePayload {
  name?: string
  country?: string
  region?: string
  variety?: string
  process?: string
  altitude?: string
  description?: string
  story?: string
  flavorNotes?: string[]
  price?: number
  stock?: number
  weights?: CoffeeWeight[]
  image?: string
  gallery?: string[]
  translations?: ICoffeeTranslations
}

export interface CreateCoffeePayload {
  slug: string
  name: string
  country: string
  region: string
  variety: string
  process: string
  altitude: string
  description: string
  story: string
  flavorNotes: string[]
  price: number
  weights: CoffeeWeight[]
  image?: string
  gallery?: string[]
  stock?: number
  translations?: ICoffeeTranslations
}
