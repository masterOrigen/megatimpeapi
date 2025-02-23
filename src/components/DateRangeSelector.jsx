import React, { useState } from 'react';
import { Button, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';

const DateRangeSelector = ({ onDateChange }) => {
	const getLastMonthDates = () => {
		const end = new Date(); // Today
		const start = new Date();
		// Go back exactly one month from current day
		start.setDate(end.getDate());
		start.setMonth(end.getMonth() - 1);
		return { start, end };
	};

	const { start, end } = getLastMonthDates();
	const [startDate, setStartDate] = useState(start);
	const [endDate, setEndDate] = useState(end);
	const [show, setShow] = useState(false);

	const formatDate = (date) => {
		const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
		const day = date.getDate().toString().padStart(2, '0');
		const month = months[date.getMonth()];
		const year = date.getFullYear();
		return `${day} ${month} ${year}`;
	};

	const predefinedRanges = [
		{ label: 'Último mes', days: 31 },
		{ label: 'Últimos 3 meses', days: 92 },
		{ label: 'Últimos 6 meses', days: 183 },
		{ label: 'Último año', days: 365 }
	];

	const handleRangeSelect = (range) => {
		const endDate = new Date();
		const startDate = new Date(endDate);
		startDate.setDate(endDate.getDate() - (range.days - 1)); // Subtract days-1 to include current day
		setStartDate(startDate);
		setEndDate(endDate);
	};



	const handleApply = () => {
		onDateChange?.(startDate, endDate);
		setShow(false);
	};

	return (
		<Dropdown show={show} onToggle={(isOpen) => setShow(isOpen)}>
			<Dropdown.Toggle variant="light" className="date-selector d-flex align-items-center gap-2">
				<FontAwesomeIcon icon={faCalendar} />
				<span>{formatDate(startDate)} - {formatDate(endDate)}</span>
			</Dropdown.Toggle>

			<Dropdown.Menu className="p-3" style={{ minWidth: '300px' }}>
				<div className="date-ranges">
					{predefinedRanges.map((range, index) => (
						<Button
							key={index}
							variant="outline-secondary"
							size="sm"
							className="me-2 mb-2"
							onClick={() => handleRangeSelect(range)}
						>
							{range.label}
						</Button>
					))}
				</div>
				<div className="mb-3">
					<label className="d-block mb-2">Fecha inicial</label>
					<input
						type="date"
						className="form-control"
						value={startDate.toISOString().split('T')[0]}
						onChange={(e) => setStartDate(new Date(e.target.value))}
					/>
				</div>
				<div className="mb-3">
					<label className="d-block mb-2">Fecha final</label>
					<input
						type="date"
						className="form-control"
						value={endDate.toISOString().split('T')[0]}
						onChange={(e) => setEndDate(new Date(e.target.value))}
					/>
				</div>
				<div className="d-grid">
					<Button variant="primary" onClick={handleApply}>Aplicar</Button>
				</div>
			</Dropdown.Menu>
		</Dropdown>
	);
};

export default DateRangeSelector;