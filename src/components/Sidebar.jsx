import React, { useState } from 'react';
import { Offcanvas, Form, FormControl, Button, ListGroup, Spinner, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ show, handleClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const navigate = useNavigate();

    const handleSearch = async (value) => {
        if (value.length >= 2) {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('SpotsEnero')
                .select('brand')
                .ilike('brand', `%${value}%`)
                .limit(8);

            if (!error && data) {
                const uniqueBrands = [...new Set(data.map(item => item.brand))];
                setSuggestions(uniqueBrands);
            }
            setIsLoading(false);
        } else {
            setSuggestions([]);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        handleSearch(value);
    };

    const handleBrandSelect = (brand) => {
        if (selectedBrands.length < 5 && !selectedBrands.includes(brand)) {
            setSelectedBrands([...selectedBrands, brand]);
            setSearchTerm('');
            setSuggestions([]);
        }
    };

    const handleRemoveBrand = (brandToRemove) => {
        setSelectedBrands(selectedBrands.filter(brand => brand !== brandToRemove));
    };

    const handleCompareBrands = () => {
        if (selectedBrands.length > 0) {
            const currentBrand = window.location.pathname.split('/brand/')[1];
            if (currentBrand) {
                const decodedCurrentBrand = decodeURIComponent(currentBrand);
                if (!selectedBrands.includes(decodedCurrentBrand)) {
                    const allBrands = [decodedCurrentBrand, ...selectedBrands];
                    navigate(`/comparison/${encodeURIComponent(allBrands.join(','))}`);
                } else {
                    navigate(`/comparison/${encodeURIComponent(selectedBrands.join(','))}`);
                }
            } else {
                navigate(`/comparison/${encodeURIComponent(selectedBrands.join(','))}`);
            }
            handleClose();
        }
    };

    return (
        <Offcanvas 
            show={show} 
            onHide={handleClose} 
            placement="end"
            style={{
                transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
                transform: show ? 'translateX(0)' : 'translateX(100%)',
                opacity: show ? 1 : 0,
                height: '100vh',
                width: '400px'
            }}
            className="sidebar-transition"
        >
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Comparar Marcas</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              

                <Form className="mb-3">
                    <FormControl
                        type="search"
                        placeholder={selectedBrands.length >= 5 ? "Máximo 5 marcas alcanzado" : "Buscar marca para comparar..."}
                        value={searchTerm}
                        onChange={handleInputChange}
                        className="mb-2"
                        disabled={selectedBrands.length >= 5}
                    />
                </Form>
                <div className="selected-brands mb-3">
                    {selectedBrands.map((brand, index) => (
                        <Badge
                            key={index}
                            bg="primary"
                            className="me-2 mb-2 p-2"
                            style={{ fontSize: '1em' }}
                        >
                            {brand}
                            <Button
                                variant="link"
                                className="p-0 ms-2"
                                onClick={() => handleRemoveBrand(brand)}
                                style={{ color: 'white', textDecoration: 'none' }}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </Button>
                        </Badge>
                    ))}
                </div>
                {isLoading ? (
                    <div className="text-center">
                        <Spinner animation="border" size="sm" />
                    </div>
                ) : (
                    <>
                        <ListGroup className="mb-3">
                            {suggestions.map((brand, index) => (
                                <ListGroup.Item
                                    key={index}
                                    action
                                    onClick={() => handleBrandSelect(brand)}
                                    className="d-flex justify-content-between align-items-center"
                                    disabled={selectedBrands.length >= 5 || selectedBrands.includes(brand)}
                                >
                                    {brand}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>

                        {selectedBrands.length > 0 && (
                            <div className="d-grid">
                                <Button variant="primary" onClick={handleCompareBrands}>
                                    Comparar Marcas
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </Offcanvas.Body>
        </Offcanvas>
    );
};

export default Sidebar;