import { sdk } from "./medusa"
import type { HttpTypes } from "@medusajs/types"

const CUSTOMER_CACHE_KEY = "medusa_customer_cached"

export type CustomerAddress = HttpTypes.StoreCustomerAddress
export type Customer = HttpTypes.StoreCustomer

type StoredCustomer = Pick<Customer, "id" | "email" | "first_name" | "last_name"> & {
  phone?: string | null
}

export async function loginCustomer(email: string, password: string): Promise<void> {
  await sdk.auth.login("customer", "emailpass", { email, password })
}

export async function registerCustomer(params: {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
}): Promise<void> {
  await sdk.auth.register("customer", "emailpass", {
    email: params.email,
    password: params.password,
  })
  await sdk.store.customer.create({
    email: params.email,
    first_name: params.first_name,
    last_name: params.last_name,
    phone: params.phone,
  })
}

export async function logoutCustomer(): Promise<void> {
  try {
    await sdk.auth.logout()
  } catch {
    // ignore — we still want to clear local state
  }
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CUSTOMER_CACHE_KEY)
  }
}

export async function retrieveCurrentCustomer(): Promise<Customer | null> {
  try {
    const { customer } = await sdk.store.customer.retrieve()
    if (customer && typeof window !== "undefined") {
      const stored: StoredCustomer = {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone ?? null,
      }
      window.localStorage.setItem(CUSTOMER_CACHE_KEY, JSON.stringify(stored))
    }
    return customer as Customer
  } catch {
    return null
  }
}

export async function updateCurrentCustomer(
  data: HttpTypes.StoreUpdateCustomer
): Promise<Customer | null> {
  const { customer } = await sdk.store.customer.update(data)
  return customer as Customer
}

export async function listCustomerAddresses(): Promise<CustomerAddress[]> {
  const res: any = await sdk.store.customer.listAddress()
  return ((res?.addresses ?? []) as CustomerAddress[])
}

export async function createCustomerAddress(
  data: HttpTypes.StoreCreateCustomerAddress
): Promise<void> {
  await sdk.store.customer.createAddress(data)
}

export async function updateCustomerAddress(
  addressId: string,
  data: HttpTypes.StoreUpdateCustomerAddress
): Promise<void> {
  await sdk.store.customer.updateAddress(addressId, data)
}

export async function deleteCustomerAddress(addressId: string): Promise<void> {
  await sdk.store.customer.deleteAddress(addressId)
}

export async function listCustomerOrders(
  limit = 50,
  offset = 0
): Promise<{ orders: HttpTypes.StoreOrder[]; count: number }> {
  const res: any = await sdk.store.order.list({ limit, offset })
  return {
    orders: (res.orders ?? []) as HttpTypes.StoreOrder[],
    count: res.count ?? 0,
  }
}

export async function retrieveCustomerOrder(
  id: string
): Promise<HttpTypes.StoreOrder | null> {
  try {
    const { order } = await sdk.store.order.retrieve(id)
    return order as HttpTypes.StoreOrder
  } catch {
    return null
  }
}
