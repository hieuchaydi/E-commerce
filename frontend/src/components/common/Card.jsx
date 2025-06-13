import React from 'react';
import PropTypes from 'prop-types';
import './Card.css';

const Card = ({ children, title, image, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {image && <img src={image} alt={title} className="card-image" />}
      <div className="card-content">
        {title && <h3 className="card-title">{title}</h3>}
        {children}
      </div>
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  image: PropTypes.string,
  className: PropTypes.string,
};

export default Card;