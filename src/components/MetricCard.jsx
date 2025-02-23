import React from 'react';
import { Card } from 'react-bootstrap';

const MetricCard = ({ title, value, icon }) => {
	return (
		<Card className="h-100 shadow-sm metric-card">
			<Card.Body className="d-flex align-items-center">
				<div className="flex-grow-1">
					<Card.Title className="mb-1">{title}</Card.Title>
					<h3 className="mb-0">{value}</h3>
				</div>
				{icon && <div className="ms-3 fs-1 text-muted">{icon}</div>}
			</Card.Body>
		</Card>
	);
};

export default MetricCard;