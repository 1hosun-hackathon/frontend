import React from 'react';
import Card from './Card';
import { MutedText } from './Typography';

export default function StatCard({ label, value, note }) {
  return (
    <Card>
      <MutedText>{label}</MutedText>
      <div className="text-3xl font-extrabold text-[#727D67]">{value}</div>
      {note && <MutedText as="small">{note}</MutedText>}
    </Card>
  );
}
