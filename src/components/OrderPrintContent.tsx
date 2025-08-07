import React from "react";

interface OrderPrintContentProps {
  order: {
    id: string;
    business_name: string;
    phone_number: string;
    caller_name: string;
    order: string;
    quantity: number;
    created_at: string;
  };
}

export const OrderPrintContent: React.FC<OrderPrintContentProps> = ({ order }) => (
  <div style={{ 
    width: '302px', 
    padding: '10px', 
    fontFamily: 'monospace', 
    fontSize: '12px', 
    color: 'black', 
    background: 'white',
    lineHeight: '1.4'
  }}>
    <h1 style={{ 
      fontSize: '1.2rem', 
      fontWeight: 'bold', 
      textAlign: 'center', 
      marginBottom: '1rem',
      borderBottom: '1px dashed black',
      paddingBottom: '0.5rem'
    }}>
      Order Receipt
    </h1>
    
    <div style={{ marginBottom: '1rem' }}>
      <p style={{ fontSize: '10px', marginBottom: '0.25rem' }}>
        <strong>Order #:</strong> {order.id.slice(0, 8).toUpperCase()}
      </p>
      <p style={{ fontSize: '10px', marginBottom: '0.25rem' }}>
        <strong>Business:</strong> {order.business_name}
      </p>
      <p style={{ fontSize: '10px', marginBottom: '0.25rem' }}>
        <strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}
      </p>
      <p style={{ fontSize: '10px', marginBottom: '0.25rem' }}>
        <strong>Time:</strong> {new Date(order.created_at).toLocaleTimeString()}
      </p>
    </div>

    <hr style={{ border: 0, borderTop: '1px dashed black', margin: '0.5rem 0' }} />

    <div style={{ marginBottom: '1rem' }}>
      <p style={{ fontSize: '10px', marginBottom: '0.25rem' }}>
        <strong>Customer:</strong> {order.caller_name}
      </p>
      <p style={{ fontSize: '10px', marginBottom: '0.25rem' }}>
        <strong>Phone:</strong> {order.phone_number}
      </p>
    </div>

    <hr style={{ border: 0, borderTop: '1px dashed black', margin: '0.5rem 0' }} />

    <div style={{ marginBottom: '1rem' }}>
      <h3 style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '0.5rem' }}>Order Details:</h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid black', paddingBottom: '2px' }}>Item</th>
            <th style={{ textAlign: 'center', borderBottom: '1px solid black', paddingBottom: '2px' }}>Qty</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ paddingTop: '2px' }}>{order.order}</td>
            <td style={{ textAlign: 'center', paddingTop: '2px' }}>{order.quantity}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <hr style={{ border: 0, borderTop: '1px dashed black', margin: '0.5rem 0' }} />

    <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
      <p style={{ fontSize: '11px', fontWeight: 'bold' }}>
        <strong>Total Amount:</strong> $0.00
      </p>
      <p style={{ fontSize: '8px', fontStyle: 'italic', marginTop: '2px' }}>
        (Amount to be calculated)
      </p>
    </div>

    <hr style={{ border: 0, borderTop: '1px dashed black', margin: '0.5rem 0' }} />

    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
      <p style={{ fontSize: '10px', fontWeight: 'bold' }}>Thank you for your order!</p>
      <p style={{ fontSize: '8px', marginTop: '0.5rem' }}>Powered by Convo Solutions</p>
    </div>
  </div>
);
