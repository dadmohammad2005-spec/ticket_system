"""
Root and health views for the Apex Ticket Booking API server.
"""
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

HTML_LANDING_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apex Tickets — Backend API Hub</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #090d16;
            --surface: #111827;
            --surface-hover: #1f2937;
            --border: #1e293b;
            --primary: #3b82f6;
            --primary-glow: rgba(59, 130, 246, 0.25);
            --emerald: #10b981;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --accent: #6366f1;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        body {
            background-color: var(--bg);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2.5rem 1.5rem;
            position: relative;
            overflow-x: hidden;
        }
        .glow-bg {
            position: absolute;
            top: -10%;
            left: 50%;
            transform: translateX(-50%);
            width: 700px;
            height: 400px;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.08) 40%, transparent 70%);
            filter: blur(60px);
            pointer-events: none;
            z-index: 0;
        }
        .container {
            max-width: 900px;
            width: 100%;
            z-index: 1;
        }
        .header {
            text-align: center;
            margin-bottom: 3rem;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.35rem 0.85rem;
            border-radius: 9999px;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #34d399;
            font-size: 0.825rem;
            font-weight: 600;
            margin-bottom: 1.25rem;
        }
        .pulse-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #10b981;
            box-shadow: 0 0 10px #10b981;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.85); }
        }
        h1 {
            font-size: 2.75rem;
            font-weight: 800;
            letter-spacing: -0.03em;
            background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.75rem;
        }
        .subtitle {
            font-size: 1.125rem;
            color: var(--text-muted);
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.6;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 1.25rem;
            margin-bottom: 2.5rem;
        }
        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 1rem;
            padding: 1.5rem;
            text-decoration: none;
            color: inherit;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
        }
        .card:hover {
            transform: translateY(-4px);
            border-color: var(--primary);
            box-shadow: 0 12px 30px -10px var(--primary-glow);
            background: var(--surface-hover);
        }
        .card-icon {
            width: 44px;
            height: 44px;
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.35rem;
            margin-bottom: 1rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .card-title {
            font-size: 1.15rem;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 0.35rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .card-arrow {
            font-size: 1.1rem;
            color: var(--text-muted);
            transition: transform 0.2s;
        }
        .card:hover .card-arrow {
            color: var(--primary);
            transform: translateX(4px);
        }
        .card-desc {
            font-size: 0.875rem;
            color: var(--text-muted);
            line-height: 1.5;
        }
        .card.featured {
            border-color: rgba(59, 130, 246, 0.4);
            background: linear-gradient(180deg, rgba(30, 58, 138, 0.2) 0%, var(--surface) 100%);
        }
        .card.frontend {
            border-color: rgba(16, 185, 129, 0.4);
            background: linear-gradient(180deg, rgba(6, 78, 59, 0.2) 0%, var(--surface) 100%);
        }
        .info-box {
            background: rgba(15, 23, 42, 0.7);
            border: 1px solid var(--border);
            border-radius: 1rem;
            padding: 1.5rem;
            backdrop-filter: blur(12px);
        }
        .info-header {
            font-size: 0.95rem;
            font-weight: 700;
            color: #e2e8f0;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .table-wrap {
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
            text-align: left;
        }
        th {
            color: var(--text-muted);
            font-weight: 600;
            padding: 0.5rem 0.75rem;
            border-bottom: 1px solid var(--border);
        }
        td {
            padding: 0.6rem 0.75rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .code {
            font-family: 'JetBrains Mono', monospace;
            background: rgba(255, 255, 255, 0.06);
            padding: 0.2rem 0.45rem;
            border-radius: 0.35rem;
            font-size: 0.8rem;
            color: #93c5fd;
        }
        .footer {
            margin-top: 2.5rem;
            text-align: center;
            font-size: 0.8rem;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="glow-bg"></div>

    <div class="container">
        <header class="header">
            <div class="badge">
                <span class="pulse-dot"></span>
                API Server Active &amp; Operational
            </div>
            <h1>Apex Tickets API Hub</h1>
            <p class="subtitle">
                Commercial high-performance Online Ticket Booking Platform engine powered by Python Django REST Framework.
            </p>
        </header>

            <a href="/ticket/APX-DEMO2026/" class="card" style="border-color: rgba(245, 158, 11, 0.4); background: linear-gradient(180deg, rgba(180, 83, 9, 0.15) 0%, var(--surface) 100%);">
                <div>
                    <div class="card-icon" style="color: #f59e0b;">🎫</div>
                    <div class="card-title">
                        Print Real Ticket
                        <span class="card-arrow">&rarr;</span>
                    </div>
                    <p class="card-desc">Authentic commercial boarding pass with live QR codes, tear-off stub, and browser print layout.</p>
                </div>
            </a>

            <a href="/api/docs/" class="card featured">
                <div>
                    <div class="card-icon" style="color: #60a5fa;">⚡</div>
                    <div class="card-title">
                        Swagger UI
                        <span class="card-arrow">&rarr;</span>
                    </div>
                    <p class="card-desc">Interactive OpenAPI 3.0 documentation. Test live endpoints, schemas, authentication and queries.</p>
                </div>
            </a>

            <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer" class="card frontend">
                <div>
                    <div class="card-icon" style="color: #34d399;">🌐</div>
                    <div class="card-title">
                        Frontend Web App
                        <span class="card-arrow">&rarr;</span>
                    </div>
                    <p class="card-desc">Modern React + TypeScript passenger booking experience running on Vite dev server.</p>
                </div>
            </a>

            <a href="/admin/" class="card">
                <div>
                    <div class="card-icon" style="color: #ec4899;">🛡️</div>
                    <div class="card-title">
                        Django Admin
                        <span class="card-arrow">&rarr;</span>
                    </div>
                    <p class="card-desc">Full administration portal for operators, fleet inventory, bookings, and customer accounts.</p>
                </div>
            </a>

            <a href="/api/redoc/" class="card">
                <div>
                    <div class="card-icon" style="color: #a78bfa;">📖</div>
                    <div class="card-title">
                        ReDoc Docs
                        <span class="card-arrow">&rarr;</span>
                    </div>
                    <p class="card-desc">Comprehensive reference documentation for mobile and third-party integrations.</p>
                </div>
            </a>
        </div>

        <div class="info-box">
            <div class="info-header">
                🔑 Pre-Seeded Demonstration Accounts &amp; Quick Links
            </div>
            <div style="margin-bottom: 1rem; display: flex; gap: 0.75rem; flex-wrap: wrap;">
                <a href="/ticket/APX-DEMO2026/" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.85rem; border-radius: 0.5rem; background: #2563eb; color: white; text-decoration: none; font-size: 0.8rem; font-weight: 700;">
                    🖨️ View &amp; Print Real Demo Ticket (APX-DEMO2026)
                </a>
                <a href="/api/tickets/download-pdf/APX-DEMO2026/" target="_blank" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.85rem; border-radius: 0.5rem; background: #059669; color: white; text-decoration: none; font-size: 0.8rem; font-weight: 700;">
                    📥 Download PDF Boarding Pass
                </a>
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Role</th>
                            <th>Email Address</th>
                            <th>Password</th>
                            <th>Scope</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong style="color: #60a5fa;">System Admin</strong></td>
                            <td><span class="code">admin@apextickets.com</span></td>
                            <td><span class="code">Admin@12345</span></td>
                            <td>Platform Dashboard, Analytics, Fleet &amp; Users</td>
                        </tr>
                        <tr>
                            <td><strong style="color: #f59e0b;">Transport Operator</strong></td>
                            <td><span class="code">operator@apextickets.com</span></td>
                            <td><span class="code">Operator@12345</span></td>
                            <td>Vehicle &amp; Trip Schedules, Route Management</td>
                        </tr>
                        <tr>
                            <td><strong style="color: #34d399;">Customer Passenger</strong></td>
                            <td><span class="code">customer@apextickets.com</span></td>
                            <td><span class="code">Customer@12345</span></td>
                            <td>Search Trips, Seat Selection, Checkout, Boarding Passes</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <footer class="footer">
            Apex Online Ticket Booking Platform &bull; Django 5.1 &bull; REST Framework &bull; JWT Authentication
        </footer>
    </div>
</body>
</html>
"""

import json
import base64
import qrcode
from io import BytesIO
from datetime import timedelta
from django.shortcuts import render
from apps.bookings.models import Booking

def api_root_view(request):
    """
    Renders an executive visual landing hub when requested from a browser,
    or returns structured JSON metadata when requested via API client.
    """
    accept_header = request.headers.get('accept', '')
    if 'application/json' in accept_header or request.GET.get('format') == 'json':
        return JsonResponse({
            'name': 'Apex Tickets API',
            'version': '1.0.0',
            'status': 'healthy',
            'printable_ticket_demo': request.build_absolute_uri('/ticket/APX-DEMO2026/'),
            'pdf_ticket_demo': request.build_absolute_uri('/api/tickets/download-pdf/APX-DEMO2026/'),
            'documentation': {
                'swagger_ui': request.build_absolute_uri('/api/docs/'),
                'redoc': request.build_absolute_uri('/api/redoc/'),
                'openapi_schema': request.build_absolute_uri('/api/schema/'),
            },
            'admin_panel': request.build_absolute_uri('/admin/'),
            'frontend_app': 'http://localhost:5173',
            'endpoints': {
                'auth': request.build_absolute_uri('/api/auth/profile/'),
                'locations': request.build_absolute_uri('/api/locations/cities/'),
                'operators': request.build_absolute_uri('/api/operators/'),
                'trips': request.build_absolute_uri('/api/trips/'),
                'bookings': request.build_absolute_uri('/api/bookings/'),
                'tickets': request.build_absolute_uri('/api/tickets/'),
                'payments': request.build_absolute_uri('/api/payments/checkout/'),
                'coupons': request.build_absolute_uri('/api/coupons/'),
                'reviews': request.build_absolute_uri('/api/reviews/'),
                'analytics': request.build_absolute_uri('/api/analytics/overview/'),
            }
        })
    return HttpResponse(HTML_LANDING_PAGE, content_type='text/html')


def real_ticket_view(request, booking_ref=None):
    """
    Renders an authentic, commercial-grade, printable boarding pass
    with live scannable QR code, barcode, tear-off stub, and PDF download.
    """
    target_ref = booking_ref or request.GET.get('pnr') or 'PK-LHE-ISB-2026'
    target_ref = target_ref.strip().upper()

    booking = Booking.objects.select_related(
        'trip', 'trip__operator', 'trip__vehicle', 'trip__route',
        'trip__route__origin_city', 'trip__route__destination_city',
        'trip__route__origin_station', 'trip__route__destination_station'
    ).prefetch_related('passengers').filter(booking_reference=target_ref).first()

    if not booking:
        booking = Booking.objects.select_related(
            'trip', 'trip__operator', 'trip__vehicle', 'trip__route',
            'trip__route__origin_city', 'trip__route__destination_city',
            'trip__route__origin_station', 'trip__route__destination_station'
        ).prefetch_related('passengers').first()

    if not booking:
        return HttpResponse("<h1>No bookings found in database. Please run python manage.py seed_data</h1>", status=404)

    trip = booking.trip
    route = trip.route

    ticket_data = []
    for passenger in booking.passengers.all():
        # Generate real dynamic QR code containing verifiable ticket json
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=6,
            border=1
        )
        payload = {
            'ticket_code': passenger.ticket_number,
            'booking_ref': booking.booking_reference,
            'passenger': passenger.full_name,
            'seat': passenger.seat_number,
            'route': f"{route.origin_city.name} -> {route.destination_city.name}",
            'distance_km': f"{route.distance_km} km",
            'departure': trip.departure_time.strftime('%Y-%m-%d %H:%M'),
            'arrival': trip.arrival_time.strftime('%Y-%m-%d %H:%M'),
            'status': booking.status
        }
        qr.add_data(json.dumps(payload))
        qr.make(fit=True)
        img = qr.make_image(fill_color="#0F172A", back_color="white")
        buf = BytesIO()
        img.save(buf, format='PNG')
        qr_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

        boarding_time = (trip.departure_time - timedelta(minutes=30)).strftime('%I:%M %p')
        origin_code = route.origin_city.name[:3].upper()
        dest_code = route.destination_city.name[:3].upper()

        ticket_data.append({
            'passenger': passenger,
            'qr_base64': qr_b64,
            'boarding_time': boarding_time,
            'departure_date': trip.departure_time.strftime('%a, %b %d, %Y'),
            'departure_time': trip.departure_time.strftime('%I:%M %p'),
            'arrival_date': trip.arrival_time.strftime('%a, %b %d, %Y'),
            'arrival_time': trip.arrival_time.strftime('%I:%M %p'),
            'distance_km': route.distance_km,
            'origin_code': origin_code,
            'dest_code': dest_code,
        })

    return render(request, 'tickets/real_ticket.html', {
        'booking': booking,
        'trip': trip,
        'route': route,
        'ticket_data': ticket_data,
    })


def health_check_view(request):
    """
    Simple health check endpoint for monitoring, load balancers, and Docker/k8s probes.
    """
    return JsonResponse({
        'status': 'healthy',
        'service': 'apex-tickets-api',
        'debug': settings.DEBUG,
    })

