import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Card, Spinner } from 'react-bootstrap';
import {
	Chart as ChartJS,
	ArcElement,
	Tooltip,
	Legend,
	CategoryScale,
	LinearScale,
	BarElement
} from 'chart.js';

ChartJS.register(
	ArcElement,
	Tooltip,
	Legend,
	CategoryScale,
	LinearScale,
	BarElement
);

const ChartComponent = ({ title, data, className, type = 'doughnut', loading = false }) => {
	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: type === 'doughnut' ? 'bottom' : 'top',
				display: type === 'doughnut'
			}
		},
		scales: type === 'bar' ? {
			y: {
				beginAtZero: true
			}
		} : undefined
	};

	const ChartType = type === 'doughnut' ? Doughnut : Bar;

	return (
		<Card className={`h-100 shadow-sm ${className || ''}`}>
			<Card.Body>
				<Card.Title className="mb-3">{title}</Card.Title>
				<div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
					{loading ? (
						<Spinner animation="border" role="status">
							<span className="visually-hidden">Loading...</span>
						</Spinner>
					) : (
						<ChartType data={data} options={options} />
					)}
				</div>
			</Card.Body>
		</Card>
	);
};

export default ChartComponent;