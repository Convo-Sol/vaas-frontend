interface Order {
  id: string;
  business_name: string;
  phone_number: string;
  caller_name: string;
  order: string;
  quantity: number;
  created_at: string;
}

interface OrderPrintContentProps {
  order: Order;
  logoUrl?: string | null;
}

export const OrderPrintContent = ({ order, logoUrl }: OrderPrintContentProps) => {
  return (
    <div style={{ width: '302px', padding: '10px', fontFamily: 'monospace', fontSize: '12px', color: 'black', background: 'white' }}>
      {logoUrl && (
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <img src={logoUrl} alt="Business Logo" style={{ maxWidth: '150px', maxHeight: '75px', margin: '0 auto' }} />
        </div>
      )}
      <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem' }}>
        {order.business_name}
      </h1>
      <p style={{ textAlign: 'center', marginBottom: '1rem' }}>Order #{order.id.slice(0, 8).toUpperCase()}</p>
      <hr style={{ border: 0, borderTop: '1px dashed black', margin: '1rem 0' }} />
      <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
      <p><strong>Customer:</strong> {order.caller_name}</p>
      <p><strong>Phone:</strong> {order.phone_number}</p>
      <hr style={{ border: 0, borderTop: '1px dashed black', margin: '1rem 0' }} />
      <h2 style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '0.5rem' }}>Order Details</h2>
      <p><strong>Items:</strong> {order.order}</p>
      <p><strong>Total Quantity:</strong> {order.quantity}</p>
      <hr style={{ border: 0, borderTop: '1px dashed black', margin: '1rem 0' }} />
      <p style={{ textAlign: 'center', fontSize: '1rem', fontWeight: '600', marginTop: '1.5rem' }}>
        Thank you!
      </p>
      <p style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '0.5rem' }}>
        Powered by Vass.ai
      </p>
    </div>
  );
};