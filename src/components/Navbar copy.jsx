import React, { useState, useEffect, useRef } from 'react';
import { Navbar, Container, Form, FormControl, Button, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import DateRangeSelector from './DateRangeSelector';
import { supabase } from '../config/supabaseClient';

const NavigationBar = () => {
	const [searchTerm, setSearchTerm] = useState('');
	const [suggestions, setSuggestions] = useState([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const navigate = useNavigate();
	const searchRef = useRef(null);

	const handleDateChange = (start, end) => {

		console.log('Date range changed:', { start, end });
	};

	const fetchSuggestions = async () => {
		if (searchTerm.length >= 2) {
			setIsLoading(true);
			const { data, error } = await supabase
				.from('SpotsEnero')
				.select('brand')
				.ilike('brand', `%${searchTerm}%`)
				.limit(8);

			if (!error && data) {
				const uniqueBrands = [...new Set(data.map(item => item.brand))];
				setSuggestions(uniqueBrands);
				setShowSuggestions(true);
			}
			setIsLoading(false);
		} else {
			setSuggestions([]);
			setShowSuggestions(false);
		}
	};

	useEffect(() => {
		fetchSuggestions();
	}, [searchTerm]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (searchRef.current && !searchRef.current.contains(event.target)) {
				setShowSuggestions(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const handleSearch = (e) => {
		e.preventDefault();
		if (searchTerm) {
			navigate(`/brand/${encodeURIComponent(searchTerm)}`);
			setShowSuggestions(false);
		}
	};

	const handleSuggestionClick = (brand) => {
		// Actualizar el estado inmediatamente
		setSearchTerm(brand);
		// Limpiar las sugerencias
		setSuggestions([]);
		setShowSuggestions(false);
		setSelectedIndex(-1);
		// Navegar después de un pequeño delay
		requestAnimationFrame(() => {
			navigate(`/brand/${encodeURIComponent(brand)}`);
		});
	};

	const handleKeyDown = (e) => {
		if (!showSuggestions) return;
		
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setSelectedIndex(prev => 
					prev < suggestions.length - 1 ? prev + 1 : prev
				);
				break;
			case 'ArrowUp':
				e.preventDefault();
				setSelectedIndex(prev => prev > -1 ? prev - 1 : prev);
				break;
			case 'Enter':
				e.preventDefault();
				if (selectedIndex > -1) {
					const selectedBrand = suggestions[selectedIndex];
					setSearchTerm(selectedBrand);
					setSuggestions([]);
					setShowSuggestions(false);
					setSelectedIndex(-1);
					requestAnimationFrame(() => {
						navigate(`/brand/${encodeURIComponent(selectedBrand)}`);
					});
				} else {
					handleSearch(e);
				}
				break;
			case 'Escape':
				setShowSuggestions(false);
				setSelectedIndex(-1);
				break;
		}
	};


	return (
		<Navbar bg="dark" variant="dark" className="mb-4 w-100">
			<Container fluid>
				<Navbar.Brand>DASHBOARD</Navbar.Brand>
				
				<div className="d-flex mx-auto position-relative" style={{width: '40%'}}>
					<Form className="d-flex w-100" onSubmit={handleSearch}>
						<FormControl
							ref={searchRef}
							type="search"
							placeholder="Buscar marca..."
							className="me-2"
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
								setSelectedIndex(-1);
							}}
							onFocus={() => setShowSuggestions(true)}
							onKeyDown={handleKeyDown}
						/>

						<Button variant="outline-light" type="submit">Buscar</Button>
					</Form>
					{showSuggestions && (suggestions.length > 0 || isLoading) && (
						<ListGroup 
							className="position-absolute w-100"
							style={{ 
								top: '100%', 
								zIndex: 1000,
								maxHeight: '300px',
								overflowY: 'auto',
								marginTop: '2px',
								boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
								backgroundColor: '#fff',
								borderRadius: '4px'
							}}
						>
							{isLoading ? (
								<ListGroup.Item className="text-center py-3">
									<span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
									Buscando...
								</ListGroup.Item>
							) : (
								suggestions.map((brand, index) => (
									<ListGroup.Item 
										key={index}
										action
										active={index === selectedIndex}
										onClick={() => handleSuggestionClick(brand)}
										style={{
											padding: '12px 15px',
											cursor: 'pointer',
											transition: 'all 0.2s ease',
											backgroundColor: index === selectedIndex ? '#e9ecef' : '#fff'
										}}
										className="border-0"
									>
										{brand}
									</ListGroup.Item>
								))
							)}
						</ListGroup>
					)}
				</div>

				<div className="d-flex align-items-center">
					<DateRangeSelector onDateChange={handleDateChange} />
				</div>
			</Container>
		</Navbar>
	);
};

export default NavigationBar;
