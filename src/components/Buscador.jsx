import React, { useState } from 'react';
import { Form, FormControl, Button } from 'react-bootstrap';
import { supabase } from '../config/supabaseClient';
import { useNavigate } from 'react-router-dom';

const Buscador = () => {
    const [searchValue, setSearchValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigate = useNavigate();

    const handleSearch = async (value) => {
        if (value.length >= 2) {
            const { data, error } = await supabase
                .from('SpotsEnero')
                .select('brand')
                .ilike('brand', `%${value}%`)
                .limit(8);

            if (!error && data) {
                const uniqueBrands = [...new Set(data.map(item => item.brand))];
                setSuggestions(uniqueBrands);
                setShowSuggestions(true);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleChange = (e) => {
        const value = e.target.value;
        setSearchValue(value);
        handleSearch(value);
    };

    const selectSuggestion = (suggestion) => {
        console.log('Seleccionando:', suggestion);
        setSearchValue(suggestion);
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (searchValue.trim()) {
            navigate(`/brand/${encodeURIComponent(searchValue)}`);
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <Form className="d-flex w-100" onSubmit={handleSubmit}>
                <FormControl
                    type="text"
                    placeholder="Buscar marca..."
                    value={searchValue}
                    onChange={handleChange}
                    className="me-2"
                />
                <Button variant="outline-light" type="submit">
                    Buscar
                </Button>
            </Form>

            {showSuggestions && suggestions.length > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        zIndex: 1000,
                        marginTop: '4px'
                    }}
                >
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            onClick={() => selectSuggestion(suggestion)}
                            style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: index < suggestions.length - 1 ? '1px solid #ddd' : 'none',
                                backgroundColor: 'white'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        >
                            {suggestion}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Buscador;
