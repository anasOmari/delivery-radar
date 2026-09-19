'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Star, ExternalLink, Globe, MessageCircle } from 'lucide-react';
import { Lead } from '@/lib/types';
import { CITY_COORDINATES } from '@/lib/mockData';

interface MapViewProps {
  leads: Lead[];
  activeCity: string;
  onOpenWhatsApp: (lead: Lead) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  leads,
  activeCity,
  onOpenWhatsApp
}) => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(leads[0] || null);

  const cityCoords = CITY_COORDINATES[activeCity] || { lat: 24.7136, lng: 46.6753 };

  return (
    <div className="map-view-container">
      {/* Map Header */}
      <div className="map-view-header">
        <div className="flex-align gap-2">
          <MapPin size={20} className="text-purple" />
          <h3>توزيع المحلات في خريطة {activeCity}</h3>
          <span className="badge-count">{leads.length} موقع</span>
        </div>
        <span className="text-sm subtext">اضغط على دبابيس الموقع لعرض تفاصيل التواصل</span>
      </div>

      {/* Simulated Interactive Map Display */}
      <div className="simulated-map">
        <div className="map-grid-background">
          <div className="map-overlay-city">{activeCity} - المنطقة التجارية</div>

          {/* Render pins positioned relative to center */}
          {leads.map((lead, idx) => {
            const latDiff = (lead.lat || cityCoords.lat) - cityCoords.lat;
            const lngDiff = (lead.lng || cityCoords.lng) - cityCoords.lng;
            
            // Map offsets to percentages for container
            const top = Math.min(85, Math.max(15, 50 - latDiff * 800));
            const left = Math.min(85, Math.max(15, 50 + lngDiff * 800));

            const isSelected = selectedLead?.id === lead.id;

            return (
              <div
                key={lead.id || idx}
                className={`map-pin-marker ${isSelected ? 'selected' : ''}`}
                style={{ top: `${top}%`, left: `${left}%` }}
                onClick={() => setSelectedLead(lead)}
              >
                <div className="pin-head">
                  <MapPin size={18} />
                </div>
                <div className="pin-label">{lead.name.split(' ')[0]}</div>
              </div>
            );
          })}
        </div>

        {/* Selected Pin Details Card Popup */}
        {selectedLead && (
          <div className="map-lead-popup">
            <div className="popup-header">
              <div>
                <h4>{selectedLead.name}</h4>
                <p className="popup-sub">{selectedLead.category} - {selectedLead.city}</p>
              </div>
              <div className="badge-rating">
                <Star size={14} fill="#f59e0b" color="#f59e0b" />
                <span>{selectedLead.rating}</span>
                <span className="rating-count">({selectedLead.userRatingsTotal})</span>
              </div>
            </div>

            <div className="popup-body">
              <div className="info-row">
                <MapPin size={14} />
                <span>{selectedLead.address}</span>
              </div>
              {selectedLead.phone && (
                <div className="info-row highlight-phone">
                  <Phone size={14} />
                  <span>{selectedLead.phone}</span>
                </div>
              )}
              {selectedLead.website && (
                <div className="info-row">
                  <Globe size={14} />
                  <a href={selectedLead.website} target="_blank" rel="noreferrer" className="link-text">
                    الموقع الإلكتروني
                  </a>
                </div>
              )}
            </div>

            <div className="popup-footer">
              <button className="btn btn-whatsapp btn-sm" onClick={() => onOpenWhatsApp(selectedLead)}>
                <MessageCircle size={14} />
                <span>مراسلة واتساب</span>
              </button>

              {selectedLead.googleMapsUrl && (
                <a
                  href={selectedLead.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  <ExternalLink size={14} />
                  <span>خرائط جوجل</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
