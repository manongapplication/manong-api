export interface PaymongoPaymentMethod {
  data: {
    id: string;
    type: string;
    attributes: {
      type: string;
      billing: {
        email: string;
        name: string;
      };
      details: {
        exp_month: number;
        exp_year: number;
        last4: string;
      };
    };
  };
}

export interface PaymongoAttach {
  data: {
    id: string;
    type: string;
    attributes: {
      amount: number;
      capture_type: string;
      client_key: string;
      currency: string;
      description: string;
      livemode: boolean;
      original_amount: number;
      statement_descriptor: string;
      status: string;
      last_payment_error: string | null;
      payment_method_allowed: Array<string>;
      payments: [
        {
          id: string;
          type: string;
          attributes: {
            amount: number;
            balance_transaction_id: string;
            billing: {
              email: string;
              name: string;
            };
            currency: string;
            description: string;
            fee: number;
            foreign_fee: number;
            livemode: boolean;
            net_amount: number;
            payment_intent_id: string;
            status: string;
          };
        },
      ];
      next_action: {
        type: string;
        redirect: {
          url: string;
          return_url: string;
        };
      };
    };
  };
}

export interface PaymongoPaymentIntent {
  data: {
    id: string;
    type: string;
    attributes: {
      amount: number;
      capture_type: string;
      client_key: string;
      currency: string;
      description: string;
      livemode: boolean;
      original_amount: number;
      statement_descriptor: string;
      status: string;
      payment_method_allowed: Array<string>;
      payments: [
        {
          id: string;
          type: string;
        },
      ];
      next_action: {
        type: string;
        redirect: {
          url: string;
          return_url: string;
        };
      };
    };
  };
}

export interface CreatePayment {
  id: string;
  type: string;
  attributes: {
    amount: number;
    capture_type: string;
    client_key: string;
    currency: string;
    description: string;
    livemode: boolean;
    original_amount: number;
    statement_descriptor: string;
    status: string;
    last_payment_error: string | null;
    payment_method_allowed: Array<string>;
  };
}

export interface PaymongoCreateCustomer {
  data: {
    id: string | null;
    type: string;
    attributes: {
      default_device: string;
      default_payment_method_id: string | null;
      live_mode: boolean;
      email: string;
      first_name: string;
      has_vaulted_payment_methods: boolean;
      last_name: string;
      phone: string | null;
      created_at: number;
      updated_at: number;
    };
  };
}

export interface PaymongoCustomer {
  has_more: boolean;
  data: [
    {
      id: string;
      type: string;
      attributes: {
        default_device: string;
        default_payment_method_id: string | null;
        livemode: boolean;
        email: string;
        first_name: string;
        has_vaulted_payment_methods: boolean;
        last_name: string;
        phone: string | null;
        created_at: number;
        updated_at: number;
      };
    },
  ];
}

export interface PaymongoRefund {
  data: {
    id: string;
    type: string;
    attributes: {
      amount: number;
      balance_transaction_id: string | null;
      currency: string | null;
      livemode: boolean;
      metadata: string | null;
      notes: string | null;
      payment_id: string | null;
      payout_id: string | null;
      reason: string;
      status: string;
      available_at: number;
      created_at: number;
      refunded_at: number | null;
      updated_at: number;
    };
  };
}
