import React from 'react';
import BookingForm from '../components/BookingForm';

const BookingPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Бронирование номера</h1>
      <BookingForm />
    </div>
  );
};

export default BookingPage;
