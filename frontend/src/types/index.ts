export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'staff' | 'technician';
  is_active: boolean;
}

export interface Customer {
  id: string;
  full_name: string;
  email?: string;
  phone: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  estimated_price?: number;
  estimated_duration_hours?: number;
  is_active: boolean;
  created_at: string;
}

export interface StatusHistory {
  id: string;
  old_status?: string;
  new_status: string;
  notes?: string;
  changed_by?: string;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  reference_number: string;
  customer_id?: string;
  service_category_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  equipment_details?: string;
  problem_description: string;
  preferred_date?: string;
  additional_notes?: string;
  status: 'new' | 'under_review' | 'accepted' | 'rejected' | 'converted';
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  status_history: StatusHistory[];
}

export interface WorkOrder {
  id: string;
  work_order_number: string;
  service_request_id?: string;
  customer_id: string;
  technician_id?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  scheduled_date?: string;
  completed_date?: string;
  work_performed?: string;
  completion_notes?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  technician_name?: string;
  status_history: StatusHistory[];
}

export interface Technician {
  id: string;
  full_name: string;
  email?: string;
  phone: string;
  skills?: string;
  is_available: boolean;
  is_active: boolean;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  quantity: number;
  unit: string;
  low_stock_threshold: number;
  cost_price?: number;
  sell_price?: number;
  is_active: boolean;
  is_low_stock: boolean;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  item_type: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  work_order_id?: string;
  service_request_id?: string;
  invoice_date: string;
  due_date?: string;
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'cancelled';
  subtotal: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  notes?: string;
  terms?: string;
  created_at: string;
  items: InvoiceItem[];
  customer_name?: string;
  work_order_number?: string;
  service_request_reference?: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  payment_date: string;
  amount: number;
  payment_method: 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';
  transaction_reference?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

export interface DashboardSummary {
  total_customers: number;
  total_service_requests: number;
  pending_requests: number;
  active_work_orders: number;
  completed_jobs: number;
  total_technicians: number;
  unpaid_invoices: number;
  revenue_collected: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
