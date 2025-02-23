import React from 'react';
import { Navbar, Container } from 'react-bootstrap';
import DateRangeSelector from './DateRangeSelector';
import Buscador from './Buscador';

const NavigationBar = () => {
	const handleDateChange = (start, end) => {
		console.log('Date range changed:', { start, end });
	};

	return (
		<Navbar bg="dark" variant="dark" className="mb-4 w-100">
			<Container fluid>
				<Navbar.Brand>DASHBOARD</Navbar.Brand>
				
				<div className="d-flex mx-auto position-relative" style={{ width: '40%' }}>
					<Buscador />
				</div>

				<DateRangeSelector onDateChange={handleDateChange} />
			</Container>
		</Navbar>
	);
};

export default NavigationBar;