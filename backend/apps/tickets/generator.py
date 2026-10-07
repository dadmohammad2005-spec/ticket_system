import io
import json
import qrcode
from io import BytesIO
from django.core.files.base import ContentFile
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from .models import DigitalTicket

def generate_qr_for_ticket(digital_ticket: DigitalTicket):
    """Generates and attaches a real QR code image to the DigitalTicket model"""
    booking = digital_ticket.booking
    trip = booking.trip
    passenger = digital_ticket.passenger
    
    qr_payload = {
        'ticket_code': digital_ticket.ticket_code,
        'booking_ref': booking.booking_reference,
        'passenger': passenger.full_name,
        'seat': passenger.seat_number,
        'route': f"{trip.route.origin_city.name} -> {trip.route.destination_city.name}",
        'date': trip.departure_time.strftime('%Y-%m-%d %H:%M'),
        'operator': trip.operator.name,
        'status': booking.status,
    }
    json_data = json.dumps(qr_payload)
    digital_ticket.qr_data = json_data
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(json_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="#1E3A8A", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    file_name = f"qr_{digital_ticket.ticket_code}.png"
    digital_ticket.qr_code_image.save(file_name, ContentFile(buffer.getvalue()), save=False)
    digital_ticket.save()

def generate_booking_pdf(booking) -> bytes:
    """Generates an executive, branded boarding pass PDF for the entire booking"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36
    )
    styles = getSampleStyleSheet()
    story = []

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#1E3A8A'),
        alignment=0,
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B'),
    )
    header_right = ParagraphStyle(
        'HeaderRight',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#2563EB'),
        alignment=2,
    )

    trip = booking.trip
    route = trip.route

    # Header Banner Table
    header_data = [
        [
            Paragraph("<b>APEX TRAVEL</b><br/><font size=9 color='#64748B'>Official Boarding Pass & E-Ticket</font>", title_style),
            Paragraph(f"<b>PNR: {booking.booking_reference}</b><br/><font size=9 color='#10B981'>STATUS: {booking.status}</font>", header_right)
        ]
    ]
    t_header = Table(header_data, colWidths=[4.0 * inch, 3.5 * inch])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(t_header)
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceAfter=14))

    # Journey summary card
    journey_data = [
        [
            Paragraph(f"<b>OPERATOR:</b> {trip.operator.name}", styles['Normal']),
            Paragraph(f"<b>VEHICLE:</b> {trip.vehicle.model_name} ({trip.vehicle.vehicle_number})", styles['Normal']),
        ],
        [
            Paragraph(f"<b>FROM:</b> {route.origin_city.name} ({route.origin_station.name if route.origin_station else 'Main Terminal'})", styles['Normal']),
            Paragraph(f"<b>TO:</b> {route.destination_city.name} ({route.destination_station.name if route.destination_station else 'Main Station'})", styles['Normal']),
        ],
        [
            Paragraph(f"<b>DEPARTURE:</b> {trip.departure_time.strftime('%a, %b %d, %Y - %I:%M %p')}", styles['Normal']),
            Paragraph(f"<b>EST. ARRIVAL:</b> {trip.arrival_time.strftime('%a, %b %d, %Y - %I:%M %p')}", styles['Normal']),
        ],
        [
            Paragraph(f"<b>ROUTE DISTANCE:</b> {route.distance_km} KM ({trip.duration_formatted})", styles['Normal']),
            Paragraph(f"<b>TOTAL PAID:</b> Rs. {booking.final_amount}", styles['Normal']),
        ]
    ]
    t_journey = Table(journey_data, colWidths=[3.75 * inch, 3.75 * inch])
    t_journey.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_journey)
    story.append(Spacer(1, 16))

    # Passengers breakdown
    story.append(Paragraph("<b>PASSENGER TICKETS & SEAT ASSIGNMENTS</b>", styles['Heading3']))
    story.append(Spacer(1, 6))

    pass_table_data = [
        ["Ticket #", "Passenger Name", "CNIC / ID", "Seat #", "Fare"]
    ]
    for p in booking.passengers.all():
        pass_table_data.append([
            p.ticket_number,
            p.full_name,
            p.id_card_number or 'N/A',
            p.seat_number,
            f"Rs. {p.price}"
        ])

    t_passengers = Table(pass_table_data, colWidths=[1.8 * inch, 2.2 * inch, 1.5 * inch, 1.0 * inch, 1.0 * inch])
    t_passengers.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3A8A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(t_passengers)
    story.append(Spacer(1, 16))

    # Important Policies Notice
    story.append(Paragraph("<b>IMPORTANT TRAVEL INFORMATION</b>", styles['Heading4']))
    policies_text = (
        "1. Please arrive at the boarding terminal at least 30 minutes prior to scheduled departure.<br/>"
        "2. All passengers must present valid government photo identification matching the passenger name.<br/>"
        "3. Baggage allowance: 2 standard pieces up to 25kg total per passenger.<br/>"
        "4. Cancellations and refunds are governed by the operator's official cancellation policy."
    )
    story.append(Paragraph(policies_text, subtitle_style))

    doc.build(story)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
