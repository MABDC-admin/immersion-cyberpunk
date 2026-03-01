'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function CalendarClient() {
    const { data: session } = useSession();
    const [events, setEvents] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetchCalendarData();
    }, []);

    const fetchCalendarData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/calendar');
            if (res.ok) {
                const data = await res.json();
                setEvents(data.events || []);
                setShifts(data.shifts || []);
            }
        } catch (error) {
            console.error('Failed to fetch calendar:', error);
        } finally {
            setLoading(false);
        }
    };

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const numDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    const today = new Date();
    const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const getEventsForDay = (day) => {
        const dateStr = new Date(year, month, day).toISOString().split('T')[0];
        return events.filter(e => {
            const startStr = new Date(e.start).toISOString().split('T')[0];
            const endStr = new Date(e.end).toISOString().split('T')[0];
            return dateStr >= startStr && dateStr <= endStr;
        });
    };

    const getShiftsForDay = (day) => {
        const date = new Date(year, month, day);
        const dayOfWeek = dayNames[date.getDay()];
        return shifts.filter(s => s.workDays?.includes(dayOfWeek));
    };

    if (loading) {
        return (
            <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div style={{ color: 'var(--primary)', fontSize: '18px', animation: 'pulse 2s infinite' }}>
                    ⌛ Initializing Nexus Calendar...
                </div>
            </div>
        );
    }

    return (
        <div className="page" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ filter: 'drop-shadow(0 0 8px var(--primary))' }}>📅</span> Nexus Calendar
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>View shifts, approved leaves, and company holidays.</p>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-panel)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '20px' }}>◀</button>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, minWidth: '150px', textAlign: 'center' }}>
                        {monthNames[month]} {year}
                    </h2>
                    <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '20px' }}>▶</button>
                </div>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)', 
                gap: '1px', 
                background: 'var(--border-color)',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                boxShadow: '0 0 30px rgba(0,0,0,0.3)'
            }}>
                {/* Header */}
                {dayNames.map(day => (
                    <div key={day} style={{ 
                        background: 'rgba(0,0,0,0.4)', 
                        padding: '12px', 
                        textAlign: 'center', 
                        fontWeight: 600, 
                        fontSize: '12px', 
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        {day}
                    </div>
                ))}

                {/* Padding for first day */}
                {[...Array(firstDay)].map((_, i) => (
                    <div key={`pad-${i}`} style={{ background: 'rgba(255,255,255,0.02)', minHeight: '120px' }} />
                ))}

                {/* Days */}
                {[...Array(numDays)].map((_, i) => {
                    const day = i + 1;
                    const dayEvents = getEventsForDay(day);
                    const dayShifts = getShiftsForDay(day);
                    
                    return (
                        <div key={day} style={{ 
                            background: isToday(day) ? 'rgba(0, 243, 255, 0.05)' : 'var(--bg-panel)', 
                            minHeight: '120px',
                            padding: '8px',
                            position: 'relative',
                            transition: 'background 0.2s',
                            cursor: 'pointer'
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '8px'
                            }}>
                                <span style={{ 
                                    fontSize: '16px', 
                                    fontWeight: isToday(day) ? 700 : 400,
                                    color: isToday(day) ? 'var(--primary)' : 'var(--text-primary)',
                                    background: isToday(day) ? 'rgba(0, 243, 255, 0.1)' : 'transparent',
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                }}>
                                    {day}
                                </span>
                                {isToday(day) && <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 600 }}>TODAY</span>}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {dayEvents.map(event => (
                                    <div key={event.id} style={{
                                        fontSize: '10px',
                                        padding: '4px 6px',
                                        borderRadius: '4px',
                                        background: event.type === 'Holiday' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                        borderLeft: `3px solid ${event.type === 'Holiday' ? '#ef4444' : '#10b981'}`,
                                        color: event.type === 'Holiday' ? '#fca5a5' : '#6ee7b7',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }} title={event.description}>
                                        {event.title}
                                    </div>
                                ))}

                                {dayShifts.map(shift => (
                                    <div key={shift.id} style={{
                                        fontSize: '10px',
                                        padding: '4px 6px',
                                        borderRadius: '4px',
                                        background: 'rgba(59, 130, 246, 0.2)',
                                        borderLeft: '3px solid #3b82f6',
                                        color: '#93c5fd',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        ⌚ {shift.name}: {shift.startTime}-{shift.endTime}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <div style={{ width: '12px', height: '12px', background: 'rgba(239, 68, 68, 0.2)', borderLeft: '3px solid #ef4444', borderRadius: '2px' }} />
                    Company Holiday
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <div style={{ width: '12px', height: '12px', background: 'rgba(16, 185, 129, 0.2)', borderLeft: '3px solid #10b981', borderRadius: '2px' }} />
                    Approved Leave
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <div style={{ width: '12px', height: '12px', background: 'rgba(59, 130, 246, 0.2)', borderLeft: '3px solid #3b82f6', borderRadius: '2px' }} />
                    Assigned Shift
                </div>
            </div>
        </div>
    );
}
