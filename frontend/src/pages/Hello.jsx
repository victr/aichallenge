import React from 'react';
import { Link } from 'react-router-dom';

export default function Hello() {
  return (
    <div className="row">
      <div className="col-md-8">
        <h2>Hello there 👋</h2>
        <p>Welcome to Vik's AI Challenge.</p>
        <Link to="/day1" className="btn btn-primary">Go to Day1</Link>
      </div>
    </div>    
  );
}
