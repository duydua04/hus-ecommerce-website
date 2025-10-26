--
-- PostgreSQL database dump
--

\restrict vqmnGgg1gC2YSqjN51fvuOjqNtjfbhQrdzDnZdTkL8snOWzdIfNuUIgWDgaD4VF

-- Dumped from database version 16.10 (Debian 16.10-1.pgdg13+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP PUBLICATION IF EXISTS pub_all;
ALTER TABLE IF EXISTS ONLY public.shopping_cart_item DROP CONSTRAINT IF EXISTS shopping_cart_item_variant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopping_cart_item DROP CONSTRAINT IF EXISTS shopping_cart_item_size_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopping_cart_item DROP CONSTRAINT IF EXISTS shopping_cart_item_shopping_cart_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopping_cart_item DROP CONSTRAINT IF EXISTS shopping_cart_item_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shopping_cart DROP CONSTRAINT IF EXISTS shopping_cart_buyer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.seller_address DROP CONSTRAINT IF EXISTS seller_address_seller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.seller_address DROP CONSTRAINT IF EXISTS seller_address_address_id_fkey;
ALTER TABLE IF EXISTS ONLY public.review_reply DROP CONSTRAINT IF EXISTS review_reply_seller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.review_reply DROP CONSTRAINT IF EXISTS review_reply_review_id_fkey;
ALTER TABLE IF EXISTS ONLY public.review DROP CONSTRAINT IF EXISTS review_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.review DROP CONSTRAINT IF EXISTS review_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.review_image DROP CONSTRAINT IF EXISTS review_image_review_id_fkey;
ALTER TABLE IF EXISTS ONLY public.review DROP CONSTRAINT IF EXISTS review_buyer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product_variant DROP CONSTRAINT IF EXISTS product_variant_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product_size DROP CONSTRAINT IF EXISTS product_size_variant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product DROP CONSTRAINT IF EXISTS product_seller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product_image DROP CONSTRAINT IF EXISTS product_image_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product DROP CONSTRAINT IF EXISTS product_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.order_item DROP CONSTRAINT IF EXISTS order_item_variant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.order_item DROP CONSTRAINT IF EXISTS order_item_size_id_fkey;
ALTER TABLE IF EXISTS ONLY public.order_item DROP CONSTRAINT IF EXISTS order_item_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.order_item DROP CONSTRAINT IF EXISTS order_item_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public."order" DROP CONSTRAINT IF EXISTS order_discount_id_fkey;
ALTER TABLE IF EXISTS ONLY public."order" DROP CONSTRAINT IF EXISTS order_carrier_id_fkey;
ALTER TABLE IF EXISTS ONLY public."order" DROP CONSTRAINT IF EXISTS order_buyer_id_fkey;
ALTER TABLE IF EXISTS ONLY public."order" DROP CONSTRAINT IF EXISTS order_buyer_address_id_fkey;
ALTER TABLE IF EXISTS ONLY public.buyer_address DROP CONSTRAINT IF EXISTS buyer_address_buyer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.buyer_address DROP CONSTRAINT IF EXISTS buyer_address_address_id_fkey;
DROP INDEX IF EXISTS public.idx_product_variant_product_id;
DROP INDEX IF EXISTS public.idx_product_sold_seller;
DROP INDEX IF EXISTS public.idx_product_sold_quantity;
DROP INDEX IF EXISTS public.idx_product_sold_category;
DROP INDEX IF EXISTS public.idx_product_size_variant_id;
DROP INDEX IF EXISTS public.idx_buyer_phone;
DROP INDEX IF EXISTS public.idx_buyer_email;
DROP INDEX IF EXISTS public.idx_buyer_buyer_id;
DROP INDEX IF EXISTS public.idx_admin_phone;
DROP INDEX IF EXISTS public.idx_admin_email;
DROP INDEX IF EXISTS public.idx_admin_admin_id;
ALTER TABLE IF EXISTS ONLY public.product_size DROP CONSTRAINT IF EXISTS uq_variant_size_name;
ALTER TABLE IF EXISTS ONLY public.product_variant DROP CONSTRAINT IF EXISTS uq_product_variant_name;
ALTER TABLE IF EXISTS ONLY public.shopping_cart DROP CONSTRAINT IF EXISTS shopping_cart_pkey;
ALTER TABLE IF EXISTS ONLY public.shopping_cart_item DROP CONSTRAINT IF EXISTS shopping_cart_item_pkey;
ALTER TABLE IF EXISTS ONLY public.seller DROP CONSTRAINT IF EXISTS seller_pkey;
ALTER TABLE IF EXISTS ONLY public.seller DROP CONSTRAINT IF EXISTS seller_phone_key;
ALTER TABLE IF EXISTS ONLY public.seller DROP CONSTRAINT IF EXISTS seller_email_key;
ALTER TABLE IF EXISTS ONLY public.seller_address DROP CONSTRAINT IF EXISTS seller_address_pkey;
ALTER TABLE IF EXISTS ONLY public.review_reply DROP CONSTRAINT IF EXISTS review_reply_pkey;
ALTER TABLE IF EXISTS ONLY public.review DROP CONSTRAINT IF EXISTS review_pkey;
ALTER TABLE IF EXISTS ONLY public.review_image DROP CONSTRAINT IF EXISTS review_image_pkey;
ALTER TABLE IF EXISTS ONLY public.product_variant DROP CONSTRAINT IF EXISTS product_variant_pkey;
ALTER TABLE IF EXISTS ONLY public.product_size DROP CONSTRAINT IF EXISTS product_size_pkey;
ALTER TABLE IF EXISTS ONLY public.product DROP CONSTRAINT IF EXISTS product_pkey;
ALTER TABLE IF EXISTS ONLY public.product_image DROP CONSTRAINT IF EXISTS product_image_pkey;
ALTER TABLE IF EXISTS ONLY public."order" DROP CONSTRAINT IF EXISTS order_pkey;
ALTER TABLE IF EXISTS ONLY public.order_item DROP CONSTRAINT IF EXISTS order_item_pkey;
ALTER TABLE IF EXISTS ONLY public.discount DROP CONSTRAINT IF EXISTS discount_pkey;
ALTER TABLE IF EXISTS ONLY public.discount DROP CONSTRAINT IF EXISTS discount_code_key;
ALTER TABLE IF EXISTS ONLY public.category DROP CONSTRAINT IF EXISTS category_pkey;
ALTER TABLE IF EXISTS ONLY public.category DROP CONSTRAINT IF EXISTS category_category_name_key;
ALTER TABLE IF EXISTS ONLY public.carrier DROP CONSTRAINT IF EXISTS carrier_pkey;
ALTER TABLE IF EXISTS ONLY public.buyer DROP CONSTRAINT IF EXISTS buyer_pkey;
ALTER TABLE IF EXISTS ONLY public.buyer DROP CONSTRAINT IF EXISTS buyer_phone_key;
ALTER TABLE IF EXISTS ONLY public.buyer DROP CONSTRAINT IF EXISTS buyer_email_key;
ALTER TABLE IF EXISTS ONLY public.buyer_address DROP CONSTRAINT IF EXISTS buyer_address_pkey;
ALTER TABLE IF EXISTS ONLY public.admin DROP CONSTRAINT IF EXISTS admin_pkey;
ALTER TABLE IF EXISTS ONLY public.admin DROP CONSTRAINT IF EXISTS admin_phone_key;
ALTER TABLE IF EXISTS ONLY public.admin DROP CONSTRAINT IF EXISTS admin_email_key;
ALTER TABLE IF EXISTS ONLY public.address DROP CONSTRAINT IF EXISTS address_pkey;
DROP TABLE IF EXISTS public.shopping_cart_item;
DROP TABLE IF EXISTS public.shopping_cart;
DROP TABLE IF EXISTS public.seller_address;
DROP TABLE IF EXISTS public.seller;
DROP TABLE IF EXISTS public.review_reply;
DROP TABLE IF EXISTS public.review_image;
DROP TABLE IF EXISTS public.review;
DROP TABLE IF EXISTS public.product_variant;
DROP TABLE IF EXISTS public.product_size;
DROP TABLE IF EXISTS public.product_image;
DROP TABLE IF EXISTS public.product;
DROP TABLE IF EXISTS public.order_item;
DROP TABLE IF EXISTS public."order";
DROP TABLE IF EXISTS public.discount;
DROP TABLE IF EXISTS public.category;
DROP TABLE IF EXISTS public.carrier;
DROP TABLE IF EXISTS public.buyer_address;
DROP TABLE IF EXISTS public.buyer;
DROP TABLE IF EXISTS public.admin;
DROP TABLE IF EXISTS public.address;
DROP TYPE IF EXISTS public.seller_tier;
DROP TYPE IF EXISTS public.seller_address_label_enum;
DROP TYPE IF EXISTS public.payment_status_enum;
DROP TYPE IF EXISTS public.payment_method_enum;
DROP TYPE IF EXISTS public.order_status_enum;
DROP TYPE IF EXISTS public.buyer_tier;
DROP TYPE IF EXISTS public.buyer_address_label_enum;
--
-- Name: buyer_address_label_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.buyer_address_label_enum AS ENUM (
    'home',
    'office',
    'other'
);


--
-- Name: buyer_tier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.buyer_tier AS ENUM (
    'bronze',
    'silver',
    'gold',
    'platinum',
    'diamond'
);


--
-- Name: order_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status_enum AS ENUM (
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'returned'
);


--
-- Name: payment_method_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_method_enum AS ENUM (
    'bank_transfer',
    'cod',
    'mim_pay'
);


--
-- Name: payment_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status_enum AS ENUM (
    'pending',
    'paid',
    'failed',
    'refunded'
);


--
-- Name: seller_address_label_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.seller_address_label_enum AS ENUM (
    'headquarters',
    'warehouse',
    'other'
);


--
-- Name: seller_tier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.seller_tier AS ENUM (
    'regular',
    'preferred',
    'mall'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: address; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.address (
    address_id integer NOT NULL,
    fullname character varying(255) NOT NULL,
    street character varying(255) NOT NULL,
    ward character varying(50) NOT NULL,
    district character varying(50) NOT NULL,
    province character varying(100) DEFAULT ''::character varying NOT NULL,
    phone character varying(20) DEFAULT ''::character varying NOT NULL
);


--
-- Name: address_address_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.address ALTER COLUMN address_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.address_address_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: admin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin (
    admin_id integer NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    fname character varying(255) NOT NULL,
    lname character varying(255),
    password character varying(255) NOT NULL,
    avt_url character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: admin_admin_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.admin ALTER COLUMN admin_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.admin_admin_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buyer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.buyer (
    buyer_id integer NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    fname character varying(255) NOT NULL,
    lname character varying(255),
    password character varying(255) NOT NULL,
    avt_url character varying(255),
    buyer_tier public.buyer_tier DEFAULT 'bronze'::public.buyer_tier NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: buyer_address; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.buyer_address (
    buyer_address_id integer NOT NULL,
    buyer_id integer NOT NULL,
    address_id integer NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    label public.buyer_address_label_enum
);


--
-- Name: buyer_address_buyer_address_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.buyer_address ALTER COLUMN buyer_address_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.buyer_address_buyer_address_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buyer_buyer_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.buyer ALTER COLUMN buyer_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.buyer_buyer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: carrier; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carrier (
    carrier_id integer NOT NULL,
    carrier_name character varying(255) NOT NULL,
    carrier_avt_url character varying(255),
    base_price numeric(10,2) NOT NULL,
    price_per_kg numeric(10,2) DEFAULT 5000 NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: carrier_carrier_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.carrier ALTER COLUMN carrier_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.carrier_carrier_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.category (
    category_id integer NOT NULL,
    category_name character varying(255) NOT NULL
);


--
-- Name: category_category_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.category ALTER COLUMN category_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.category_category_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: discount; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount (
    discount_id integer NOT NULL,
    code character varying(50) NOT NULL,
    discount_percent numeric(4,2) NOT NULL,
    min_order_value numeric(10,2) DEFAULT 0 NOT NULL,
    max_discount numeric(10,2),
    start_date date NOT NULL,
    end_date date NOT NULL,
    usage_limit integer,
    used_count integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: discount_discount_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.discount ALTER COLUMN discount_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.discount_discount_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."order" (
    order_id integer NOT NULL,
    buyer_id integer NOT NULL,
    buyer_address_id integer NOT NULL,
    payment_method public.payment_method_enum NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    shipping_price numeric(10,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0 NOT NULL,
    total_price numeric(10,2) NOT NULL,
    order_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    delivery_date timestamp without time zone,
    order_status public.order_status_enum DEFAULT 'pending'::public.order_status_enum NOT NULL,
    payment_status public.payment_status_enum DEFAULT 'pending'::public.payment_status_enum NOT NULL,
    discount_id integer,
    carrier_id integer NOT NULL,
    notes text
);


--
-- Name: order_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_item (
    order_item_id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    variant_id integer,
    size_id integer,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL
);


--
-- Name: order_item_order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.order_item ALTER COLUMN order_item_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.order_item_order_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: order_order_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public."order" ALTER COLUMN order_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.order_order_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product (
    product_id integer NOT NULL,
    name character varying(255) NOT NULL,
    seller_id integer NOT NULL,
    base_price numeric(10,2) NOT NULL,
    rating numeric(2,1) DEFAULT 0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    category_id integer,
    description text,
    discount_percent numeric(4,2) DEFAULT 0 NOT NULL,
    weight numeric(10,2),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    sold_quantity integer DEFAULT 0 NOT NULL,
    CONSTRAINT chk_product_sold_quantity_non_negative CHECK ((sold_quantity >= 0))
);


--
-- Name: product_image; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_image (
    product_image_id integer NOT NULL,
    product_id integer NOT NULL,
    image_url character varying(500) NOT NULL,
    is_primary boolean DEFAULT false NOT NULL
);


--
-- Name: product_image_product_image_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.product_image ALTER COLUMN product_image_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.product_image_product_image_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: product_product_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.product ALTER COLUMN product_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.product_product_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: product_size; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_size (
    size_id integer NOT NULL,
    variant_id integer NOT NULL,
    size_name character varying(20) NOT NULL,
    available_units integer DEFAULT 0 NOT NULL,
    in_stock boolean DEFAULT true NOT NULL
);


--
-- Name: product_size_size_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.product_size ALTER COLUMN size_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.product_size_size_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: product_variant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_variant (
    variant_id integer NOT NULL,
    product_id integer NOT NULL,
    variant_name character varying(100) NOT NULL,
    price_adjustment numeric(10,2) DEFAULT 0 NOT NULL
);


--
-- Name: product_variant_variant_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.product_variant ALTER COLUMN variant_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.product_variant_variant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: review; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review (
    review_id integer NOT NULL,
    product_id integer NOT NULL,
    buyer_id integer NOT NULL,
    order_id integer NOT NULL,
    review_text text,
    rating numeric(2,1) NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    review_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: review_image; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_image (
    review_image_id integer NOT NULL,
    review_id integer NOT NULL,
    image_url character varying(500) NOT NULL
);


--
-- Name: review_image_review_image_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.review_image ALTER COLUMN review_image_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.review_image_review_image_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: review_reply; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_reply (
    review_reply_id integer NOT NULL,
    review_id integer NOT NULL,
    seller_id integer NOT NULL,
    reply_text text NOT NULL,
    reply_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: review_reply_review_reply_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.review_reply ALTER COLUMN review_reply_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.review_reply_review_reply_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: review_review_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.review ALTER COLUMN review_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.review_review_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: seller; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seller (
    seller_id integer NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    fname character varying(255) NOT NULL,
    lname character varying(255),
    password character varying(255) NOT NULL,
    shop_name character varying(255) NOT NULL,
    seller_tier public.seller_tier DEFAULT 'regular'::public.seller_tier NOT NULL,
    avt_url character varying(255),
    average_rating numeric(2,1) DEFAULT 0 NOT NULL,
    rating_count integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: seller_address; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seller_address (
    seller_address_id integer NOT NULL,
    seller_id integer NOT NULL,
    address_id integer NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    label public.seller_address_label_enum
);


--
-- Name: seller_address_seller_address_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.seller_address ALTER COLUMN seller_address_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.seller_address_seller_address_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: seller_seller_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.seller ALTER COLUMN seller_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.seller_seller_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: shopping_cart; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopping_cart (
    shopping_cart_id integer NOT NULL,
    buyer_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone
);


--
-- Name: shopping_cart_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shopping_cart_item (
    shopping_cart_item_id integer NOT NULL,
    shopping_cart_id integer NOT NULL,
    product_id integer NOT NULL,
    variant_id integer,
    size_id integer,
    quantity integer DEFAULT 1 NOT NULL,
    added_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: shopping_cart_item_shopping_cart_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.shopping_cart_item ALTER COLUMN shopping_cart_item_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.shopping_cart_item_shopping_cart_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: shopping_cart_shopping_cart_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.shopping_cart ALTER COLUMN shopping_cart_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.shopping_cart_shopping_cart_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: address; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.address (address_id, fullname, street, ward, district, province, phone) FROM stdin;
1	Hoàng Đình Duy	79 Ngụy Như Kon Tum	Nhân Chính	Thanh Xuân	Hà Nội	0123456789
5	Duy	334 Nguyễn Trãi	Thanh Xuân Trung	Thanh Xuân	Hà Nội	555555555
6	Huế	Tân Tiến	Chi Lăng	Hưng Hà	Thái Bình	045678944
\.


--
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin (admin_id, email, phone, fname, lname, password, avt_url, created_at) FROM stdin;
1	admin1@example.com	0900000001	Admin	Super	$2b$12$UQQXx3Eo/Qaq0G7XPW7L4unuIl8M7FyKcuU8uPDEHhMZuHr4BGuK6	\N	2025-09-04 07:45:59.329063
2	admin2@example.com	0900000002	Admin2	Admin2	$2b$12$IYsWMeNzykt6QMjAGSTU5.O65OKFP4MMGTHwzFuUOEMJmHJaIKHC.	\N	2025-09-04 07:48:29.26751
\.


--
-- Data for Name: buyer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.buyer (buyer_id, email, phone, fname, lname, password, avt_url, buyer_tier, is_active, created_at) FROM stdin;
2	duybeck04@gmail.com		Hoàng	Duy	$2b$12$FRsLTk9dtfy7IVrXB0bP/.Trsgif01cBttY1xJJm4AjoG3kR/naLa	https://lh3.googleusercontent.com/a/ACg8ocKEzau7V4JTkki3XmQq_yriFsCncL2Y-prQwVI80DKiInyVUg=s96-c	bronze	t	2025-10-19 12:59:19.963175
1	myname@example.com	0994654771	Name	My	$2b$12$0cdDIhnA4qZ4uUd0R8ODvO7WjQpZMLiCJM/mbdw6nVKIHJSJguWz2	avatars/2025/10/8a54495ccfb34d1b9f861b82e4aad803.jpg	bronze	t	2025-08-22 11:01:29.930014
\.


--
-- Data for Name: buyer_address; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.buyer_address (buyer_address_id, buyer_id, address_id, is_default, label) FROM stdin;
1	1	1	t	home
5	1	5	f	other
6	1	6	f	home
\.


--
-- Data for Name: carrier; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.carrier (carrier_id, carrier_name, carrier_avt_url, base_price, price_per_kg, is_active) FROM stdin;
1	Giao Hàng Tiết Kiệm	avatars/2025/09/83ce4a46a6354d6085cba82f4c7e1262.jpeg	10000.00	5000.00	t
2	Giao Hàng Nhanh	avatars/2025/09/d3fdbcbcfd2c41f6a6465f2b3631c8ec.jpg	12000.00	4000.00	t
\.


--
-- Data for Name: category; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.category (category_id, category_name) FROM stdin;
1	Thời Trang Nam
2	Thời Trang Nữ
6	Thiết Bị Điện Gia Dụng
10	Nhà Cửa - Đời Sống
11	Điện Thoại - Máy Tính Bảng
12	Đồ Chơi - Mẹ & Bé
13	Thiết Bị Số - Phụ Kiện Số
14	Điện Gia Dụng
15	Làm Đẹp - Sức Khỏe
16	Ô Tô - Xe Máy - Xe Đạp
17	Bách Hóa Online
18	Thể Thao - Dã Ngoại
19	Cross Border - Hàng Quốc Tế
20	Laptop - Máy Vi Tính - Linh kiện
21	Giày - Dép nam
22	Điện Tử - Điện Lạnh
23	Giày - Dép nữ
24	Máy Ảnh - Máy Quay Phim
25	Phụ kiện thời trang
26	NGON
27	Đồng hồ và Trang sức
28	Balo và Vali
29	Voucher - Dịch vụ
30	Túi thời trang nữ
31	Túi thời trang nam
32	Chăm sóc nhà cửa
\.


--
-- Data for Name: discount; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.discount (discount_id, code, discount_percent, min_order_value, max_discount, start_date, end_date, usage_limit, used_count, is_active) FROM stdin;
1	ABC123	10.00	100000.00	100.00	2025-09-27	2025-09-30	1	0	t
2	MNP123	50.00	50000.00	1000.00	2025-09-27	2025-10-29	200	0	t
\.


--
-- Data for Name: order; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."order" (order_id, buyer_id, buyer_address_id, payment_method, subtotal, shipping_price, discount_amount, total_price, order_date, delivery_date, order_status, payment_status, discount_id, carrier_id, notes) FROM stdin;
\.


--
-- Data for Name: order_item; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_item (order_item_id, order_id, product_id, variant_id, size_id, quantity, unit_price, total_price) FROM stdin;
\.


--
-- Data for Name: product; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product (product_id, name, seller_id, base_price, rating, review_count, category_id, description, discount_percent, weight, is_active, created_at, sold_quantity) FROM stdin;
38	Bộ quần áo nam, set đồ nam Houston thời trang, chất thun cotton cao cấp - FORMEN SHOP- FMPS222	4	239000.00	0.0	0	1	Bộ quần áo nam, set đồ nam Houston thời trang, chất thun cotton cao cấp - FORMEN SHOP- FMPS222\nSet nam Houston nổi bật với đặc tính chất dày mịn, giúp bạn luôn cảm thấy thoáng mát và thoải mái...	0.00	0.72	t	2025-10-24 03:18:06.916946	0
39	Áo thun nam cổ tròn tay ngắn, chất thun mè mềm mại, co giãn thoải mái – FORMEN SHOP – FMARD002	4	210000.00	0.0	0	1	THÔNG TIN SẢN PHẨM\n- Chất liệu: Chất vải caro mè- Màu sắc: Trắng, Đen, Xanh dương- Kích cỡ: M [50-58 Kg], L [58-65 Kg]. XL [65-75 Kg], XXL [75-85 Kg]\nHÌNH ẢNH SẢN PHẨM	77.00	0.44	t	2025-10-24 03:18:06.916946	0
40	Áo chống nắng nam cao cấp, thông hơi, chống nắng, chống tia UV, chống bám bụi – FORMEN SHOP – FMTHT024	4	215000.00	0.0	0	1	CHI TIẾT SẢN PHẨM\nÁO KHOÁC NAM CHỐNG NẮNG, CHỐNG TIA UV\n- Chất liệu Aris lỗ thoáng Nhật 100% \n- Có 3 size: M &lt;60kg , L &lt;68kg , XL &lt;76kg\n- Có 4 màu: Đen - Xanh đen - Xám nhạt - Xám đậm\nHÌNH...	54.00	1.00	t	2025-10-24 03:18:06.916946	0
41	Áo thun nam cổ tròn tay ngắn, chất thun lạnh mềm mại, co giãn thoải mái – FORMEN SHOP – FMPS134	4	189000.00	0.0	0	1	- Màu sắc: Xanh bích, Trắng, Cam- Chất liệu : poly co dãn 4 chiều- Form áo : form suông VN với 4 size M, L, XL, XXL dành cho người từ 50-85kg- Size: M&lt; 58KG, L&lt; 68KG , XL&lt; 76KG, XXL&lt; 85KG...	58.00	0.33	t	2025-10-24 03:18:06.916946	0
36	Áo sơ mi nữ trung niên cổ tròn tay lỡ, Áo kiểu thêu hoa, Áo nữ bigsize NeSa Shop chất liệu cao cấp mềm nhẹ mát SMH.61	5	165000.00	0.0	0	2	Áo sơ mi nữ trung niên cổ tròn tay lỡ bigsize NeSa Shop chất liệu cao cấp mềm nhẹ mát\n   THÔNG TIN SẢN PHẨM\n   1.Tên sản phẩm: Áo sơ mi nữ, áo kiểu nữ trung niên Chảnh 24h\n   2. Đặc điểm:...	12.00	0.14	t	2025-10-24 03:16:10.047303	0
37	Áo len mongtoghi nữ hàng Quảng Châu, chất vải mềm mịn, co dãn 4 chiều, Áo len tay ngắn nhiều mẫu đẹp Nesa Shop	5	71000.00	0.0	0	2	Áo len mongtoghi nữ, chất vải mềm mịn, co dãn 4 chiều, Áo len tay ngắn nhiều mẫu đẹp Nesa ShopTHÔNG TIN SẢN PHẨM1. Tên sản phẩm: Áo kiểu nữ, áo len nữ tay ngắn co giãn, thấm hút mồ hôi, vải mềm mịn...	0.00	0.71	t	2025-10-24 03:16:10.047303	0
48	Điện Thoại Oppo A3 6GB/128GB - Hàng Chính Hãng	6	3989000.00	0.0	0	11	Điện Thoại Oppo A3 6GB/128GB - Hàng Chính Hãng\nBộ sản phẩm bao gồm: Thân máy, sạc, cáp USB, dụng cụ lấy sim, vỏ bảo vệ, sách hướng dẫn.\n\nMàn hình sắc nét\n- Sở hữu màn hình IPS LCD kích thước 6.67...	0.00	0.15	t	2025-10-24 04:23:41.347605	0
49	Điện Thoại Oppo A38 4GB/128GB - Hàng Chính Hãng	6	3139000.00	0.0	0	11	Điện Thoại Oppo A38 4GB/128GB - Hàng Chính Hãng\nBộ sản phẩm bao gồm: Thân máy, sạc, cáp USB, dụng cụ lấy sim, vỏ bảo vệ, sách hướng dẫn.\n\nNâng cao trải nghiệm với màn hình lớn\n- Trang bị cho điện...	0.00	0.17	t	2025-10-24 04:23:41.347605	0
50	Điện Thoại Realme Note 60x 3GB/64GB - Hàng Chính Hãng	6	2069000.00	0.0	0	11	Điện Thoại Realme Note 60x 3GB/64GB - Hàng Chính Hãng\nBộ sản phẩm bao gồm: Thân máy, sạc, cáp USB, dụng cụ lấy sim, vỏ bảo vệ, sách hướng dẫn sử dụng.\n\nSắc nét, mượt mà và dịu nhẹ cho đôi mắt\n- Trang...	0.00	0.19	t	2025-10-24 04:23:41.347605	0
51	Điện Thoại Oppo A18 4GB/64GB - Hàng Chính Hãng	6	2589000.00	0.0	0	11	Điện Thoại Oppo A18 4GB/64GB - Hàng Chính Hãng\nBộ sản phẩm bao gồm: Thân máy, sạc, cáp USB, dụng cụ lấy sim, sách hướng dẫn, vỏ bảo vệ.\n\nHiển thị chi tiết hình ảnh\n- Với màn hình IPS LCD rộng 6.56...	0.00	0.27	t	2025-10-24 04:23:41.347605	0
52	Điện Thoại Samsung Galaxy A06 4GB/64GB - Hàng Chính Hãng	6	3190000.00	0.0	0	11	Điện Thoại Samsung A06 4GB/64GB - Hàng Chính Hãng\nBộ sản phẩm bao gồm: Thân máy, cáp dữ liệu, tài liệu hướng dẫn, dụng cụ lấy sim.\n\nMàn hình to rộng 6.7". Trải nghiệm xem phim cực đã\n- Tối đa tầm...	0.00	0.30	t	2025-10-24 04:23:41.347605	0
32	Áo sơ mi nữ form rộng dài tay NeSa Shop, Chất liệu Đũi mềm mịn, thoáng mát, áo kiểu nữ form rộng SMH.038	5	132000.00	0.0	0	2	Áo sơ mi kiểu tay lỡ cổ đức, áo kiểu nữ dễ thương, chất liệu Đũi tơ mềm mát, thấm hút mồ hôi NeSa Shop\n   THÔNG TIN VỀ SẢN PHẨM:\n   1. Tên sản phẩm: Áo sơ mi kiểu tay lỡ cổ đức, áo kiểu nữ dễ...	10.00	0.80	t	2025-10-24 03:16:10.047303	0
33	Áo lụa trung niên cao cấp tặng mẹ form rộng tay lỡ cổ sơ mi cách điệu, áo kiểu nữ đẹp NeSa Shop SMH.59	5	155000.00	0.0	0	2	THÔNG TIN SẢN PHẨM\n   2. Đặc điểm: Áo được thiết kế dạng chui đầu rất dễ mặc và tôn dáng\n   - Có thể phối áo sơ mi nữ cùng với quần jean, quần kaki, quần tây, chân váy rất xinh\n   - Áo...	6.00	0.98	t	2025-10-24 03:16:10.047303	0
34	Đồ bộ trung niên tay ngắn cho Bà cho Mẹ, chất liệu Đũi mát mẻ, thấm hút mồ hôi, đồ bộ mặc nhà NeSa Shop ĐBH.27	5	199000.00	0.0	0	2	Đồ bộ trung niên Tay cộc cho Bà cho Mẹ, chất liệu Đũi mát mẻ, thấm hút mồ hôi, đồ bộ mặc nhà.\n   THÔNG TIN SẢN PHẨM\n   1. Tên sản phẩm: Đồ bộ trung niên tay ngắn cho Bà cho Mẹ, chất liệu...	27.00	1.01	t	2025-10-24 03:16:10.047303	0
35	Quần kiểu nữ ống suông, dài, chất liệu Tăm thái mát, vải mềm mịn, quần nữ form rộng, thoải mái, QNH.58	5	65000.00	0.0	0	2	Quần kiểu nữ ống suông, dài, chất liệu Đũi mát, vải mềm mịn, quần nữ form rộng, thoải mái.THÔNG TIN SẢN PHẨM1 Tên sản phẩm: Quần kiểu nữ ống suông, dài, chất liệu tăm thái mát, vải mềm mịn, quần nữ...	0.00	1.04	t	2025-10-24 03:16:10.047303	0
53	Điện Thoại Samsung Galaxy A36 5G 8GB/128GB - Hàng Chính Hãng	6	6519000.00	0.0	0	11	Điện Thoại Samsung A36 5G 8GB/128GB - Hàng Chính Hãng\nBộ sản phẩm bao gồm: Thân máy, cáp sạc, dụng cụ lấy sim, sách hướng dẫn.\n\nMàn hình Super AMOLED 6,7 inch ấn tượng\n- Trang bị màn hình kích thước...	0.00	0.16	t	2025-10-24 04:23:41.347605	0
54	Điện Thoại Samsung Galaxy A26 5G 8GB/128GB - Hàng Chính Hãng	6	5489000.00	0.0	0	11	Điện Thoại Samsung A26 5G 8GB/128GB - Hàng Chính Hãng\nBộ sản phẩm bao gồm: Thân máy, cáp dữ liệu, tài liệu hướng dẫn, dụng cụ lấy sim.\n\nMàn hình 120 Hz mượt mà, trải nghiệm cực đã\n- Trang bị tấm nền...	0.00	0.24	t	2025-10-24 04:23:41.347605	0
61	Kem tan mỡ Missha Hot Burning Perfect Body Gel Hàn Quốc	7	350000.00	0.0	0	15	Kem tan mỡ Missha Hot Burning Perfect Body Gel Hàn QuốcXuất xứ: Hàn QuốcThương hiệu: MisshaThể tích: 200 ml\n\n- Kem tan mỡ Missha Hot Burning Perfect Body Gel còn nuôi dưỡng da mềm mại, mịn màng, xóa...	55.00	0.18	t	2025-10-24 04:46:46.432736	0
42	Quần short nam FM NEWBASIC, chất thun Pique cao cấp, thời trang năng động - FORMEN SHOP - FMPS229	4	169000.00	0.0	0	1	Quần đùi nam, chất thun Pique cao cấp, 4 màu\nTủ đô của bạn chắc chắn không thể thiếu chiếc quần lưng chun thời trang này\nThông tin sản phẩm:\n– Chất thun Pique bền đẹp, thấm hút, co dãn tốt\n– Có big...	0.00	0.41	t	2025-10-24 03:18:06.916946	0
43	Áo khoác dù nam, áo gió nam cao cấp, chống nắng, chống bám bụi – FORMEN SHOP – FMHN005	4	209000.00	0.0	0	1	THÔNG TIN SẢN PHẨM\nNếu mặc áo khoác vải Kaki sợ phai màu thì áo khoác dù là lựa chọn cực kì hợp lý ạ!Vải may 2 lớp chắc chắn, áo chống nước nhẹ, giặt nhanh khô nữa!Áo thiết kế hiện đại, có in chữ...	62.00	0.79	t	2025-10-24 03:18:06.916946	0
44	Áo thun polo nam Cavalry chất thun cotton muối cao cấp - FORMEN SHOP - FMPS258	4	180000.00	0.0	0	1	Polo Cavalry\n—\nChất liệu: Cotton muối 100% cotton\nMàu sắc: Xanh đen, xám, rêu\nSize L: Dành cho nam từ 55kg đến 65kg\nSize XL: Dành cho nam từ 65kg đến 75kg\nSize XXL: Dành cho nam từ 75kg đến...	0.00	0.73	t	2025-10-24 03:18:06.916946	0
45	Combo siêu tiết kiệm 3 áo thun thể thao nam, chất thun lạnh co giãn tốt, thoáng mát thoải mái vận động - FORMEN SHOP - FMCB3TY002	4	189000.00	0.0	0	1	Combo siêu tiết kiệm 3 áo thun thể thao nam, chất thun lạnh co giãn tốt, thoáng mát thoải mái vận động - FORMEN SHOP - FMCB3TY002\nÁo cổ tròn thể thao của FORMEN SHOP là 1 chiếc áo thun nam thể thao...	0.00	0.63	t	2025-10-24 03:18:06.916946	0
46	Áo polo ngắn tay thời trang nam phối màu nhiều kiểu, chất thun cá sấu xịn - FORMEN SHOP - FMHK002	4	59000.00	0.0	0	1	Áo thun polo nam cổ bẻ thun cá sấu cao cấp, thiết kế đơn giản trơn basic - FORMEN SHOP - FMHK001\nÁo thun polo nam có bo cổ polo phối sọc cách điệu của FORMEN SHOP là 1 chiếc áo thun nam polo...	0.00	0.66	t	2025-10-24 03:18:06.916946	0
47	Áo polo ngắn tay nam, chất thun poly mềm mịn co giãn 4 chiều, họa tiết phối màu trẻ trung - FORMEN SHOP - FMPS195	4	89000.00	0.0	0	1	Áo polo ngắn tay nam, chất thun poly mềm mịn co giãn 4 chiều, họa tiết phối màu trẻ trung - FORMEN SHOP - FMPS195\nÁo thun polo nam có bo cổ polo phối sọc cách điệu của FORMEN SHOP là 1 chiếc áo thun...	0.00	0.24	t	2025-10-24 03:18:06.916946	0
55	Kem Mờ Sẹo Gentacin của Nhật 10g - Hỗ trợ trị sẹo lồi sẹo lõm	7	170000.00	0.0	0	15	Sẹo là điều khó có thể tránh khỏi sau khi da bị tổn thương. Không kể đến việc ảnh hưởng đến chức năng, việc có sẹo đã gây ra ảnh hưởng rất lớn đến thẩm mỹ và tâm lý. Đặc biệt là vết sẹo bị tối màu ở...	68.00	0.15	t	2025-10-24 04:46:46.432736	0
56	SON GIÓ FRAN WILSON MOODMATCHER Giữ Ẩm Cho Môi USA	7	119000.00	0.0	0	15	Thông tin nổi bật\n\nSon Gió FRAN WILSON MOODMATCHER Giữ Ẩm Cho Môi USA\nFRAN WILSON là hãng mỹ phẩm xuất hiện hơn 30 năm tại mỹ, đặc biệt dòng son gió của hãng được khách hàng tin dùng. sản phẩm được...	0.00	0.22	t	2025-10-24 04:46:46.432736	0
57	BỘ 10 MẶT NẠ 3W CLINIC FRESH POMEGRANATE MASK SHEET + TẶNG KÈM 01 MẶT NẠ CÙNG LOẠI	7	120000.00	0.0	0	15	Mặt nạ dưỡng trắng da chống lão hóa chiết xuất lựu 3W Clinic Fresh Pomegranate Mask Sheet 23ml\nThương hiệu: 3w Clinic\nXuất xứ: Hàn Quốc\nDung tích: 23ml/miếng\nLoại da: Mọi loại da.\n\n3W Clinic là một...	46.00	0.10	t	2025-10-24 04:46:46.432736	0
58	Tẩy Tế bào Chết 3W Clinic 180ml Hàn Quốc	7	75000.00	0.0	0	15	Tẩy Tế bào Chết 3W Clinic 180ml Hàn Quốc\n\nHiện có:\n1. CAFE\n2. GẠO\n3. ỐC SÊN\n4. TRÀ XANH\n5. NHAU THAI CỪU\nTẩy Tế bào Chết 3W Clinic 180ml Hàn Quốc\n- Dung tích: 180ml\n- Xuất xứ: Hàn Quốc\n- Thương hiệu:...	0.00	0.18	t	2025-10-24 04:46:46.432736	0
59	Bộ 10 gói mặt nạ dưỡng ẩm da chiết xuất nha đam 3W Clinic Fresh Aloe Mask Sheet 23ml X 10	7	150000.00	0.0	0	15	Thương hiệu: 3W CLinic\nXuất xứ: Hàn Quốc\nQuy cách: 1 miếng/gói 23ml\nMột làn da đẹp không chỉ là làn da trắng trẻo, láng mịn được hỗ trợ bởi các loại kem dưỡng da. Da đẹp phải là da khỏe, săn chắc từ...	57.00	0.26	t	2025-10-24 04:46:46.432736	0
60	Mặt Nạ Vàng 3W Clinic Collagen Luxury Gold Peel Off Pack 100g	7	250000.00	0.0	0	15	Mặt Nạ Vàng Collagen Luxury Gold Peel Off Pack 100g\nXuất xứ: Hàn Quốc\nDung tích: 100ml\nLoại da: Mọi loại da.\n3W Clinic là một trong những thương hiệu mỹ phẩm Hàn Quốc được phái đẹp tin dùng tại nhiều...	44.00	0.21	t	2025-10-24 04:46:46.432736	0
62	Bình nước thủy tinh Elmich EL-8350T041 EL-8350T052 EL-8350T110, Hàng chính hãng, nhiều dung tích, có đồ lọc trà - JoyMall	8	187000.00	0.0	0	10	Bình nước thủy tinh Elmich EL-8350T041 EL-8350T052 EL-8350T110, Hàng chính hãng, nhiều dung tích, có đồ lọc trà-JoyMall\n \nTHÔNG TIN SẢN PHẨM\n1. EL-8350T041\nDung tích 415ml\nChất liệu Thủy tinh cao...	0.00	1.68	t	2025-10-24 05:26:08.193601	0
63	Bình giữ nhiệt inox 316 Elmich EL8315 480ml, Hàng chính hãng, nắp dùng làm cốc, có lưới lọc -JoyMall	8	499000.00	0.0	0	10	Bình giữ nhiệt inox 316 Elmich EL8315 480ml, Hàng chính hãng, nắp có thể dùng làm cốc nước, có lưới lọc trà - JoyMall\n\nTHÔNG TIN SẢN PHẨM\nMàu sắc : Xanh đậm/ Xanh nhạt\nDung tích : 480 ml\nCông dụng:...	0.00	1.54	t	2025-10-24 05:26:08.193601	0
64	Máy xay tỏi ớt dùng pin sạc Elmich PBE-8659 250ml 50w, Hàng chính hãng, bảo hành 24 tháng - JoyMall	8	276000.00	0.0	0	10	Máy xay tỏi ớt cầm tay Elmich PBE-8659 250ml 50w không dây , dùng pin sạc, Hàng chính hãng, bảo hành 24 tháng - JoyMall\nThông số kỹ thuật\nDung lượng pin : 1800mAh\nCông suất : 50W\nĐiện áp :...	0.00	0.71	t	2025-10-24 05:26:08.193601	0
65	Bình giữ nhiệt 900ml Elmich EL8299, Hàng chính hãng, inox 304, có lõi lọc pha trà, cà phê - JoyMall	8	389000.00	0.0	0	10	Bình giữ nhiệt 900ml Elmich EL8299, Hàng chính hãng, inox 304, có tay cầm, dùng gia đình, nắp có khóa an toàn - JoyMall\n\nTHÔNG TIN SẢN PHẨM\nMàu sắc: Màu sữa\nDung tích : 900ml\nCông dụng : Giữ nhiệt...	0.00	0.95	t	2025-10-24 05:26:08.193601	0
66	Bộ Dụng Cụ Chế Biến Ăn Dặm Cho Bé Elmich BabyCare EL0774, Hàng Chính Hãng, Nhựa PP An Toàn - JoyMall	8	135000.00	0.0	0	10	Bộ Dụng Cụ Chế Biến Ăn Dặm Cho Bé Elmich BabyCare EL0774, Hàng Chính Hãng, Nhựa PP An Toàn - JoyMall\n\n \nThông số kỹ thuật\nMàu sắc : Be\nKhối lượng sản phẩm : 300g\nChất liệu : Nhựa PP\nThông tin từng bộ...	0.00	1.67	t	2025-10-24 05:26:08.193601	0
67	Máy vắt cam Elmich CJE-3921OL 700ml , Hàng chính hãng, bảo hành 24 tháng - JoyMall	8	322000.00	0.0	0	10	Máy vắt cam Elmich CJE-3921OL 700ml 40w, Hàng chính hãng, xoay ép 2 chiều vắt kiệt nước, dễ tháo lắp, vệ sinh - JoyMall\n\nTHÔNG TIN SẢN PHẨM\nCông suất 40W\nDung tích 0.7 Lít\nChất liệu nhựa ABS, AS\nCó 2...	0.00	1.82	t	2025-10-24 05:26:08.193601	0
68	Bình giữ nhiệt gia đình 1.9L inox 304 Elmich EL8352, Hàng chính hãng, có tay cầm, nắp chống tràn - JoyMall	8	505000.00	0.0	0	10	Bình giữ nhiệt gia đình 1.9L inox 304 Elmich EL8352, Hàng chính hãng, có tay cầm, nắp chống tràn - JoyMall\n \nTHÔNG TIN SẢN PHẨM\nMàu sắc Đỏ\nDung tích 1.9L\nCông dụng Giữ nhiệt nóng, lạnh\nChất liệu Inox...	0.00	1.42	t	2025-10-24 05:26:08.193601	0
69	Ly giữ nhiệt inox 304 Elmich EL8345 480ml, Hàng chính hãng, lớp silicone chống trượt - JoyMall	8	200000.00	0.0	0	10	Cốc giữ nhiệt inox 304 Elmich EL8345 dung tích 480ml, Hàng chính hãng, lớp silicone chống trượt - JoyMall\n\n \n\nĐẶC ĐIỂM NỔI BẬT:\n– Chất liệu inox 304 bền bỉ và an toàn: Thân cốc được làm từ inox 304,...	0.00	1.12	t	2025-10-24 05:26:08.193601	0
70	Ly giữ nhiệt inox Elmich EL8309 900ml, Hàng chính hãng, giữ nhiệt tốt, nắp bật, kèm ống hút -JoyMall	8	322000.00	0.0	0	10	Ly giữ nhiệt Elmich EL8309 900ml, Hàng chính hãng, inox 304, giữ nóng lạnh, nắp bật, đi kèm ống hút - JoyMall\n\n\nTHÔNG TIN SẢN PHẨM\nMàu sắc : Xanh mint / Xanh navy\nDung tích : 900ml\nCông dụng : Giữ...	0.00	0.96	t	2025-10-24 05:26:08.193601	0
71	Ấm Đun Nước Inox 304 Elmich EL-3373 3L, Hàng Chính Hãng, Đun Sôi Nhanh, Dùng Được Nhiều Bếp-JoyMall	8	738000.00	0.0	0	10	Ấm đun nước inox 304 Elmich EL-3373 3L, Hàng chính hãng, đun sôi nhanh, dùng được nhiều bếp-JoyMall\n\nThông tin sản phẩm\n– Chất liệu được làm bằng Inox 304 có độ bóng cao, tuyệt đối an toàn cho sức...	0.00	1.43	t	2025-10-24 05:26:08.193601	0
\.


--
-- Data for Name: product_image; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_image (product_image_id, product_id, image_url, is_primary) FROM stdin;
12	38	products/2025/10/4837fd249bb749d2a45be494974cf6b8.jpg	f
13	38	products/2025/10/2345267669264ae4b9a22687115d0553.jpg	f
14	38	products/2025/10/b31f6d808e6a438287f6b7a42c59bfc0.jpg	f
15	38	products/2025/10/36b1946b2ea74d97812ebc5a94a6ca3c.jpg	f
16	38	products/2025/10/c1b74cee64b3432f8d537b98bd1a31f2.jpg	f
17	38	products/2025/10/4f2de212ad5e48e98cf95954a2ff7920.jpg	f
18	38	products/2025/10/6c8e51cc01a5488ebe14800107184f16.jpg	f
19	38	products/2025/10/90243f6f8e914136852fa154b5be2b6d.jpg	f
20	39	products/2025/10/564ab2a36d604c9f9c24dd3fa3400abe.png	t
21	39	products/2025/10/53178d8730f149d5aefbe7a49ad0a6dc.jpg	f
22	39	products/2025/10/46f75af1c5b241c68eaecf55a01dfee5.jpg	f
23	39	products/2025/10/5399ea4477f64b78b07d7cd126e7bf4d.jpg	f
24	39	products/2025/10/e081674d8ba44aa983a44898ff092668.jpg	f
25	39	products/2025/10/c484a02b88e04fa4814a893db9795f16.jpg	f
26	39	products/2025/10/4fae62409cdc41dcb63e481a42de6ff1.jpg	f
27	39	products/2025/10/df508345bb614fb6b2f92f2e792177f4.jpg	f
28	39	products/2025/10/792fb6b5e7cf4c98babd209cdade226d.jpg	f
29	39	products/2025/10/910260583a4342658e58f8e654a25c4a.jpg	f
30	40	products/2025/10/83b0922ff6184b7a922c83ccda6963f8.jpg	t
31	40	products/2025/10/53d0df3f53b8464b95ca95960ab78177.jpg	f
32	40	products/2025/10/eaf9c43808c54f41993736638455c3df.jpg	f
33	40	products/2025/10/957841018a6a4bc6a3f89e21ba85daf1.jpg	f
34	40	products/2025/10/e94ed202ed8542adb278232d9b9d949d.jpg	f
35	40	products/2025/10/81ce402b9c794f3c8b7671564120e92c.jpg	f
36	40	products/2025/10/1a4ea4128e1e48c5a30b3c705999fdcc.jpg	f
37	40	products/2025/10/1636dfd7bdd541478e0a73e8548bb87d.jpg	f
38	40	products/2025/10/08f069066e044a56ae2a87715736e6fa.jpg	f
39	40	products/2025/10/3b3fc31e2c2041389e9d98cc8a6cc65c.jpg	f
40	40	products/2025/10/ca8495d645b24eac9599be89c372e19c.jpg	f
41	40	products/2025/10/f754fc18a98a4816a1a50a194a8b8b8a.jpg	f
42	40	products/2025/10/2e422174578f46a38741b4f772106e02.jpg	f
43	41	products/2025/10/4e17a1acd7f241e38f60802be91d249c.jpg	t
44	41	products/2025/10/f4b52fd9465c45ae8f30cf62b2a85ee8.jpg	f
45	41	products/2025/10/52e79ae1e5ef4178a1792ce25af969d3.jpg	f
46	41	products/2025/10/9b8f3d5275114c309eb4fdd58315d731.jpg	f
47	41	products/2025/10/1434deac97e24ca6b98ede680cc8e20c.jpg	f
48	41	products/2025/10/22dfdbd444ac497fbed0ec49d04268b8.jpg	f
49	41	products/2025/10/fde2223fd0d34bb39f2f1bde3aabf613.jpg	f
50	41	products/2025/10/2f0d6974ee7e4803abaec01d38607fac.jpg	f
51	41	products/2025/10/9de5cdee26bc417ab7b2998c40fed813.jpg	f
52	41	products/2025/10/d13074e5a5a24740a198beb873c556a8.jpg	f
53	42	products/2025/10/52d6dc08972144e68512ec2b9271eeda.png	t
54	42	products/2025/10/3dc969bac511478283f7d6712cf5dfdf.jpg	f
55	42	products/2025/10/e9465c409d754cfa867ffb9b6ab1e7b1.jpg	f
56	42	products/2025/10/f97e297fdc344ecaafbf394a1a6a072c.png	f
57	42	products/2025/10/1d053f435c12462593e34786794270f3.png	f
58	42	products/2025/10/1a69f471219f452181630a9223d6a583.png	f
59	42	products/2025/10/73dbb63003c8402c996b1d3c655a6870.png	f
60	42	products/2025/10/63ae48a696c749daa9bd7784356851f0.png	f
61	42	products/2025/10/bdfaaabf93d448feb2c5fc9ddb889088.png	f
62	43	products/2025/10/b5568edd6e804e8b8e0bfe8c46c1c2c1.jpg	t
63	43	products/2025/10/645607b3490e4626ace410b5ec250a4f.jpg	f
64	43	products/2025/10/297423e4202d46a1998a8a0ddef8c9cf.jpg	f
65	43	products/2025/10/5fba4b53e83740a3a97426ccf7b4860d.jpg	f
66	43	products/2025/10/5724aa903e1b493091c97dc5cea55fa3.jpg	f
67	43	products/2025/10/d88d1a4fb05b4c16b7fced0ff6f5cd57.jpg	f
68	43	products/2025/10/30896c0a471245eda5c31ecceef880bb.jpg	f
69	43	products/2025/10/b5678e199a3d46cebeac4aef4f8307b0.jpg	f
70	43	products/2025/10/892e0710e6de4cf0932b638c72452b51.jpg	f
71	43	products/2025/10/63b3e8f491b445daab6a85ef07d83647.jpg	f
72	44	products/2025/10/0a0727804f20401d9ab13a9fe796efda.png	t
73	44	products/2025/10/6746444c88404410a7609449c5207ff8.jpg	f
74	44	products/2025/10/2e1d74c23a14448eadf0ddb53ff2f21f.png	f
75	44	products/2025/10/35ed028801dd43c699e804da6c4b5523.jpg	f
76	44	products/2025/10/e32a42fe9d874ebeb74cb2c7334bcf27.jpg	f
77	44	products/2025/10/e29c4125faa84f97ae925ffeb8103a62.png	f
78	44	products/2025/10/624793aaf75740efbebf5bdd130862d6.jpg	f
79	44	products/2025/10/ab04a66b82484189831e83441b318abf.jpg	f
80	44	products/2025/10/527cd543f1ba4dceb8f45981430d7c61.jpg	f
81	45	products/2025/10/a3662c6e91b441c58a748fb345a4ed22.jpg	t
82	45	products/2025/10/06aa6dcca4fd476aa332b5dd46254a14.jpg	f
83	45	products/2025/10/c7a88a8592c44e97b8fade765b0010a0.jpg	f
84	45	products/2025/10/2a22bea6f2644b3195b163c5f6879fce.jpg	f
85	45	products/2025/10/40aabf9445874ff0b92a547ef85a5f7a.jpg	f
86	45	products/2025/10/ec5ec827c0884c1cbbf7abe123c1a20f.jpg	f
87	45	products/2025/10/e577cc498ea445a9bb8faaeac8abafc2.jpg	f
88	45	products/2025/10/09d66e4add1e476284b18466054ef511.jpg	f
89	45	products/2025/10/65f6fef6af44488a8f6449ddd9f46416.jpg	f
90	45	products/2025/10/1b8970e5e0014a448afbfa52aaa4cfc3.jpg	f
91	45	products/2025/10/56c1c4a69d62476ba131c81c8abda6c5.jpg	f
92	46	products/2025/10/95f7304892f54634930093021521cd79.jpg	t
93	46	products/2025/10/ec02b73e002b4187a81362849118bc0e.jpg	f
94	46	products/2025/10/a8c0f80b896a49bb877f177be745ffef.jpg	f
95	46	products/2025/10/60e3b3722da04a2b9759fcdbfe88ffb8.jpg	f
96	46	products/2025/10/f112e7d8a2b744aaa7144bf0efbf1a9f.jpg	f
97	46	products/2025/10/ddc3199599794327b6e0cac06ca69388.jpg	f
98	46	products/2025/10/12ea16c0d14a4261a492de79a6827ff9.jpg	f
99	47	products/2025/10/0eecea7baed247bc801b39c4616ad27f.png	t
100	47	products/2025/10/4d13b93d459e4e2d909704569b2da2d9.jpg	f
101	47	products/2025/10/2aaaa6cf5488407b9fe02826b711282a.jpg	f
102	47	products/2025/10/0cd6580a6f814c449ec2bf6382305b92.jpg	f
103	47	products/2025/10/720c7ba702cc427d9129c5a488cb1c93.jpg	f
104	47	products/2025/10/d5fd8cac872449d9a0f5be30ec285ac9.jpg	f
105	47	products/2025/10/647cefdf075241cfa2281d0a68589919.jpg	f
106	47	products/2025/10/d944e021bc1c46bbbe5b35eda8c36679.jpg	f
107	47	products/2025/10/7e133b6aafbf400da45a2a46ce0206fd.jpg	f
108	32	products/2025/10/bfa73a6bc1794306845c85f1f8e27515.jpg	t
109	32	products/2025/10/d546a2c3adf74ee7a9c5fbd72318da85.jpg	f
110	32	products/2025/10/b3390fd1c05f4b42a9439b5f04e0fa1b.jpg	f
111	32	products/2025/10/1e4e189976724b818247433a7d1ac647.jpg	f
112	32	products/2025/10/7f0eebf9725c44abbcb6d7ffd51c4e1c.jpg	f
113	32	products/2025/10/ffc20f8fee604aa58015f0c3a05e5849.jpg	f
114	32	products/2025/10/1929bb870a7a4766b9894ed3422eead2.jpg	f
115	32	products/2025/10/afe11cbd717a48b58a5a159bb83ca35a.jpg	f
116	32	products/2025/10/acff95325ac04ccc9000c760f7357593.jpg	f
117	32	products/2025/10/c586b89eb54d42aa843808361de884d1.jpg	f
118	33	products/2025/10/4e4a6f62d54d48e185d9d20eaf1917ae.jpg	t
119	33	products/2025/10/58303f76f6a24949a4166dbfe576be20.jpg	f
120	33	products/2025/10/9e6f7d5c9bf64023acd833d2afd054a9.jpg	f
121	33	products/2025/10/c60cc0cf66b84236abbd5f1be0f8c6f6.jpg	f
122	33	products/2025/10/36c3e73eb0ce4f8f88131a8d496a09f5.jpg	f
123	33	products/2025/10/b8b4c8d9c22444efba1116084283f2a2.jpg	f
124	33	products/2025/10/18bf82a254cd437f8602357bfe52d096.jpg	f
125	33	products/2025/10/44bddc127f0f4614a1157fcbf81201da.jpg	f
126	34	products/2025/10/5da62cd15ede4be6a81eeacfef763341.jpg	t
127	34	products/2025/10/fb66715f5c7746e4a5b6ec557e6e7e92.jpg	f
128	34	products/2025/10/0d12e96036e04da5b93f74f2d202fc7a.jpg	f
129	34	products/2025/10/9864b52e6e3942ada5b9c9fcbcb3aaa5.jpg	f
130	34	products/2025/10/27d8af3c409c4061922b3518ce9f26ef.jpg	f
131	34	products/2025/10/b640baff6af4461ab26d95656fbb4a26.jpg	f
132	34	products/2025/10/3559350d1c694b85ad15e00be01bbd0b.jpg	f
133	34	products/2025/10/36c8401d01544d48b45a6345eba5c1c2.jpg	f
134	34	products/2025/10/5dda35163d0a43bb9294d224a1534c98.jpg	f
135	35	products/2025/10/bbd7f2ff100a476cb2aae562a1716c90.jpg	t
136	35	products/2025/10/b0b809151c404964af08b191ae75ab08.jpg	f
137	35	products/2025/10/486e64ad312f4473b06ba9a70ef6c1e9.jpg	f
138	35	products/2025/10/bb533df8d8024abab4a52c8c3c48c368.jpg	f
139	35	products/2025/10/779ef03c4efa4cbdb6b89e8d956ab7d2.jpg	f
140	35	products/2025/10/bf64fa6e197e4aac847d7b04b3bb779d.jpg	f
141	35	products/2025/10/854d29ae16d0418982442578efb54658.jpg	f
142	35	products/2025/10/480741189e434f989592abc72e105700.jpg	f
143	35	products/2025/10/0fbce4eea8b8476ab165c2178bc5795e.jpg	f
144	35	products/2025/10/03e89bd6b96c4abeaa086610adb67d4d.jpg	f
145	35	products/2025/10/f60034d183ee433b812243833c6d1a7a.jpg	f
146	35	products/2025/10/fcf7b8bf87224dae83d7b49ecdacb06d.jpg	f
147	35	products/2025/10/2b91595394654562b51cbe31df232e89.jpg	f
148	35	products/2025/10/926cec7ce642426dac75981072d34350.jpg	f
149	36	products/2025/10/757cbe89184d4cec971aed49c3000169.jpg	t
150	36	products/2025/10/1272d80a4c5e46d3a042260eb15404e7.jpg	f
151	36	products/2025/10/a2b912d655c348f8b400017c34a3f88c.jpg	f
152	36	products/2025/10/3d982c36bee34dbebde4f1ddf2ac14e0.jpg	f
153	36	products/2025/10/103582dc007f474d8503088408bd0942.jpg	f
154	36	products/2025/10/240c27dc5ccc428d982ec6afb33c11f8.jpg	f
155	36	products/2025/10/80e868c9408a425c9a72f1e4776f8a80.jpg	f
156	36	products/2025/10/92fa116a13c64f8fb2963a4e12eb1250.jpg	f
157	36	products/2025/10/ee2fd221e6eb47c3a4720fb107b7c6a9.jpg	f
158	37	products/2025/10/dfd8bbe00e3f430b90e9b4c992ea69a8.jpg	t
159	37	products/2025/10/aae48342a68d4daabd62dacc70b4dea4.jpg	f
160	37	products/2025/10/b1cf6046091b45bc8a0dd09e64f3440e.jpg	f
161	37	products/2025/10/4b740baa84974d11be9512f9a4f25521.jpg	f
162	37	products/2025/10/0f854ee3572c495cbbae62227a22587f.jpg	f
163	37	products/2025/10/159e01b90b304ef5804270680330386e.jpg	f
164	37	products/2025/10/790dd91030874bf0b4ffbddb0fae564f.jpg	f
165	37	products/2025/10/3831a534ba304d20866b90be3bd389c4.jpg	f
166	37	products/2025/10/167b8698c4944246802296c41b21bd70.jpg	f
167	48	products/2025/10/44ff9896a3b64380b6c91f974b6b96c0.jpg	t
168	49	products/2025/10/cf0fc0dd44f545188a4066ab94550a78.jpg	t
169	50	products/2025/10/602fe3d8c89e45899e334d62b82a4264.jpg	t
170	51	products/2025/10/0a2cea75bdbc4cf792164c5e60bc9ed1.jpg	t
171	52	products/2025/10/a74f1345d78f457f89b85ce78a7ad743.jpg	t
172	53	products/2025/10/69c39721e57e4f729dac61683c3d13ef.jpg	t
173	54	products/2025/10/a009c94fa54e4009ac1ed93f14502977.jpg	t
174	55	products/2025/10/eccb33634dea42b090d1eb2e7970a4a3.jpg	t
175	55	products/2025/10/ccbec8ec5b6d45118378420a840dfb22.jpg	f
176	55	products/2025/10/9e8cca3c4cf04272a3c1124db9ba931c.jpg	f
177	56	products/2025/10/071efb54987946a4ba47a6b292c0a7e6.jpg	t
178	56	products/2025/10/1d33e730c52244dbbb800a3e966fb463.jpg	f
179	56	products/2025/10/55d65903ee9d4623ba6eb5df684bae1f.jpg	f
180	57	products/2025/10/2c63dab3a44247b7851989abd56feff9.jpg	t
181	58	products/2025/10/3148c7f9f38f481ebf194e3a20b4e002.jpg	t
182	58	products/2025/10/f4ebf6da9b734a6fa21d84ac873c883c.jpg	f
183	59	products/2025/10/6956c4f526194e738a2ebdaca2afbcab.jpg	t
184	59	products/2025/10/a088dcf7c5e349d7a5f7ed3ad1f2a3db.jpg	f
185	59	products/2025/10/8bdcc5eb27574746957f97a9cc1e2d17.jpg	f
186	60	products/2025/10/1d7bd77766dc44e086fa096e69c190a9.png	t
187	60	products/2025/10/821e84a68c7d424d8565c38acb172f30.jpg	f
188	60	products/2025/10/c49d787ce5834f6582c921706ed0e7e0.jpg	f
189	60	products/2025/10/e7a3283a49674fbcbccb7616025e4971.png	f
190	60	products/2025/10/3234fbb77e564aa88c52b493fbc26218.jpg	f
191	61	products/2025/10/671cf6974c234645bfed98d012f5271b.jpg	t
192	61	products/2025/10/1a2cfe1efca048f78d81c783192974a2.jpg	f
193	61	products/2025/10/dbf0168d3b384cb1950ffd7d757cc7c7.jpg	f
194	61	products/2025/10/71270d9d1d7a4116828f5ec72793cfd5.jpg	f
195	61	products/2025/10/87015eebf4da44bc822c9e6bd1fe0338.jpg	f
196	62	products/2025/10/33793d71a33148fa92abd978734f3de7.jpeg	t
197	62	products/2025/10/519cc505ed40412098735656d1b5d452.jpg	f
198	62	products/2025/10/d94e8b1a5b3849748e155846b00103e9.jpg	f
199	62	products/2025/10/1bd7def40de7463595757f6009cb0475.jpeg	f
200	63	products/2025/10/d09547da23174dc999887f0a610ebacf.jpg	t
201	63	products/2025/10/3830b0ff679e43b6ba9da5408507b3d1.jpg	f
202	63	products/2025/10/9d9c8abea0694f9e9a94ccb653481b47.jpg	f
203	63	products/2025/10/3119bb41c5de41bd9b169feec6b7431c.jpg	f
204	63	products/2025/10/0198877b52324a4e97384a28615e1170.jpg	f
205	63	products/2025/10/2235616d979b443084b4051c79355c33.jpg	f
206	63	products/2025/10/a61ca1f9195c498eb9b8cf7af485348f.jpg	f
207	63	products/2025/10/cf063df3ae584eae923166da4713e7ac.jpg	f
208	63	products/2025/10/dbc437a0ebcb476fa4b2880e4d8cd6c1.jpg	f
209	63	products/2025/10/ce2a67e6c670419e8c2cebb46d454869.jpg	f
210	63	products/2025/10/a3ab3e56ee7945bbba068c00b6cd7b9c.jpg	f
211	63	products/2025/10/dae10ca9d349413fa380e771fb6bb258.jpg	f
212	63	products/2025/10/b0c11bc7c0a8448cb8d6125a29cb0b23.png	f
213	63	products/2025/10/6028ed81b75c447aa887303c879a278a.jpg	f
214	63	products/2025/10/1df7340409f94f0793eb72826f6d60bd.jpg	f
215	63	products/2025/10/513e1eee21af4c6d96c6f996a0bb9484.jpg	f
216	63	products/2025/10/d3d5e25412da4e66927a1f74867a643a.jpg	f
217	63	products/2025/10/bb4f61bbbe084eafa2426eb06139f2bc.jpg	f
218	63	products/2025/10/a5c30f1f4b7e40ed81613a7d0867d1dc.jpg	f
219	63	products/2025/10/4e80c59a0f8a4937b6ac80d111893009.jpg	f
220	64	products/2025/10/47598bab398147cebfcbceb8a57b26c7.jpg	t
221	64	products/2025/10/5fa57f10ba0a45419d03db48ea75650a.jpg	f
222	64	products/2025/10/2147fe0ccb2d4b079c9a8698fc86b995.jpg	f
223	64	products/2025/10/ae83f5c25b4d4359a13449811dc2789a.jpg	f
224	64	products/2025/10/83cfee4e6dec4fd4bac05ee507bd42d2.jpg	f
225	64	products/2025/10/270839881f2d4000828fff5095a2adaa.jpg	f
226	64	products/2025/10/417696619575414abe3b1e9e47a2112a.jpg	f
227	64	products/2025/10/da9c5ffadd3b4ef28e76642c0ef34dff.jpg	f
228	64	products/2025/10/a0d0719d6e1d42eaa8cd5dcf0b8abea5.jpg	f
229	64	products/2025/10/4f071af82f6a46d6838d724a72ebbbe9.jpg	f
230	64	products/2025/10/cd0c21cf8e3742b6986b417ec853f609.jpg	f
231	64	products/2025/10/48d67bef589d46ccaf0d7952b6fc9e84.jpg	f
232	64	products/2025/10/30a5b8c6462b4c1db6ac72747bedd376.jpg	f
233	64	products/2025/10/acb2b1187a774a07b3f84ba1a20538df.jpg	f
234	64	products/2025/10/96bf0d46fcad4bed8a62b1a2ec3a08b0.jpg	f
235	64	products/2025/10/0c8c57f5673e4c4ca74867f0368f2457.jpg	f
236	64	products/2025/10/88b61aa13e7e4644a910fa03eac96fc1.jpg	f
237	64	products/2025/10/4fb5be5141da4521a563a29e157977b1.jpg	f
238	65	products/2025/10/7850ce47246d46e182b103c8b87792d3.png	t
239	65	products/2025/10/a4f5443bc3274e759ca668d22544a475.jpg	f
240	65	products/2025/10/69bd4b03505d4195ad03f7ab0cb5210c.jpg	f
241	65	products/2025/10/43572378efef45bcbfa6a2de753dca95.jpg	f
242	65	products/2025/10/ba2500768aa543959c5809b6c6e22b0f.jpg	f
243	65	products/2025/10/f44109beb8604d9e84848125c91af665.jpg	f
244	65	products/2025/10/202dd7bf5d7e46e6b1365a6a1ecdbb7a.jpg	f
245	65	products/2025/10/b0807741805a4e298e16584bf1a549b2.jpg	f
246	65	products/2025/10/cd7d0f1d411f47f68c1c58155416b882.jpg	f
247	65	products/2025/10/64d821126e884ea280c3069001b15e8a.jpg	f
248	65	products/2025/10/64eaaad9abfd45eeb660f4561163e1e4.jpg	f
249	65	products/2025/10/a3a5938110ab4591984c89acd77ad376.jpg	f
250	65	products/2025/10/0c1e68e91bb040f5841e74e687a37fc8.jpg	f
251	65	products/2025/10/2f9c50f8a06a426896436c8c30089d29.jpg	f
252	65	products/2025/10/8fd8f306f98b4ed0bcbbacd1eac45166.jpg	f
253	65	products/2025/10/a51863184f4a4e3d8308e813e18f58b5.jpg	f
254	66	products/2025/10/e92d3c3af0f845aaa8defc4bba048c4b.jpg	t
255	66	products/2025/10/a20e9299f0fe4b3389a8efe9e4978788.jpg	f
256	66	products/2025/10/b953e1de633f4aea9207a275820636bf.jpg	f
257	66	products/2025/10/b79eea1e7ecb4d329ae215bdfa795a5a.jpg	f
258	66	products/2025/10/fe0d1123c921498a8ec9411989cb13e5.jpg	f
259	66	products/2025/10/99fb522bcfae4fc09ef59d9019d3f842.jpg	f
260	66	products/2025/10/ae568645e6e64d11a782b0a874d2b911.jpg	f
261	66	products/2025/10/27f42c3ffcb24719a70f836352da3993.jpg	f
262	66	products/2025/10/4c495cb24dd4429f8b5df1c5a2a3502b.jpg	f
263	66	products/2025/10/e2c066ddeb2042ae926805e0d81a227c.jpg	f
264	66	products/2025/10/3b6856e02b4b4f93ab3bc809f04d91b6.jpg	f
11	38	products/2025/10/0e1d4f266bfc47e59a0af718026591af.jpg	t
265	66	products/2025/10/509f7eacd6f84a5896d089b9ff31b8bd.jpg	f
266	67	products/2025/10/190582c06bf543f5baf024b9852ce50f.jpg	t
267	67	products/2025/10/f7a3beb4e6604472b0a23e747a8fb93e.jpg	f
268	67	products/2025/10/9388e759084a47fa8ae3623cc7895d52.jpg	f
269	67	products/2025/10/31c24abedc1f44689023a0c9813b6b65.jpg	f
270	67	products/2025/10/2073363af65548b3bbcbbdb512073d0c.jpg	f
271	67	products/2025/10/c071feaba0bb4a75bdaf6866aa9df535.jpg	f
272	67	products/2025/10/fe07bf5224374fc1b783e02f597c3876.jpg	f
273	67	products/2025/10/2149dc6f5ee74dbd9ec482b355bf72d6.jpg	f
274	67	products/2025/10/277b9af167b7436388a7993e8d0530e5.jpg	f
275	67	products/2025/10/4744348f9a554bc3855e34883b2801d1.jpg	f
276	67	products/2025/10/fbb83ab2b17b4b2b8e4a2fe5410a92c4.jpg	f
277	67	products/2025/10/ebb2d4801c1f4b3a8aec8f7e7ad28d50.jpg	f
278	67	products/2025/10/b755c8b71c014066835e156f148358b5.jpg	f
279	67	products/2025/10/79e561a8e7584b48b130d216cbf6fc37.jpg	f
280	68	products/2025/10/36be929eb2e74d3c8885ca34a8fa2758.jpeg	t
281	68	products/2025/10/ef8488a018464610aaa6034fb520d621.png	f
282	68	products/2025/10/7ee7baa72d55481c9aca385a318a322b.png	f
283	68	products/2025/10/4048fb4e6b544352b2a1e1ccd20fa65d.jpg	f
284	68	products/2025/10/b2dfa720cd4c4bb3b7147b86241e72a6.png	f
285	68	products/2025/10/209b4283f40348dab06308c7ebd8106c.png	f
286	68	products/2025/10/9c31dcbd7a7d4231936ab718991f8afb.png	f
287	68	products/2025/10/ff22d21a3d4148b88cb8c3c5ae87c284.jpeg	f
288	69	products/2025/10/be05501f92af4a3abff9eb89e82ef34d.jpg	t
289	69	products/2025/10/8a9318301a20411a88968b66d5af77c6.png	f
290	69	products/2025/10/d69834190ed241f382b45133e7aac41f.png	f
291	69	products/2025/10/deca77890fce47af9413677d7e7fa736.jpg	f
292	69	products/2025/10/744105cbd0d941f39471ea9944e87fb8.jpg	f
293	69	products/2025/10/357301cee758479fb0af985337f3c7cb.jpg	f
294	69	products/2025/10/46fbb161a2614b17a06a77f3644a4d39.png	f
295	69	products/2025/10/d9174b5693014c61b2eeefc0a136c33b.png	f
296	69	products/2025/10/4b47b3d3c3db4f038804b1492ae3defa.png	f
297	69	products/2025/10/6b8e0d5b023f4ff2b5b1824f137bf78c.png	f
298	70	products/2025/10/bb422b2f091341049b5ca551af4278c5.jpg	t
299	70	products/2025/10/a3e14d63c2a445bea36a3d0fe8e60b6c.jpg	f
300	70	products/2025/10/69ece4cac8064d47a067d1148bf4e0fa.jpg	f
301	70	products/2025/10/c7b44f7f653d42798ec5187e9d57b19a.jpg	f
302	70	products/2025/10/3ab34d9c9fdc4864aab6acf214578366.jpg	f
303	70	products/2025/10/170e1c199afb4d4895dc24baf7f35aa8.jpg	f
304	70	products/2025/10/16857894fdb647be8f0363f14219d71f.jpg	f
305	70	products/2025/10/6e69fe40bb6e4db587a66d39fd98d251.jpg	f
306	70	products/2025/10/614a45526b984cdb8ad0e1beff951644.jpg	f
307	70	products/2025/10/4f25a63224904f1fb4ce0f0c79d1a7ea.jpg	f
308	70	products/2025/10/e9efab4b9f3c4cf9865f9cf14599806b.jpg	f
309	70	products/2025/10/3e73849b4b5b434ca07dab9bc49a9697.jpg	f
310	70	products/2025/10/42af6a207ac24a8381f7f0da7fcf3b09.jpg	f
311	70	products/2025/10/bdace4d738cd4d02908522a1222d8291.jpg	f
312	70	products/2025/10/81a254b1139b42ed93acfe3bdc0d9523.jpg	f
313	70	products/2025/10/5e5af5ac2b564d12ba84cf8165d9fcfc.jpg	f
314	70	products/2025/10/170250475abe44529de1c71f3e12a6d1.jpg	f
315	71	products/2025/10/6997415cf1de4355a9594157687c9983.png	t
316	71	products/2025/10/ae4765121c274476b6e3250a1fd6e829.jpg	f
317	71	products/2025/10/a1ab8c536cc94618ae09e6dcf28439f2.jpg	f
318	71	products/2025/10/93f9ff5531ec446193a62eb6ea4452f8.jpg	f
319	71	products/2025/10/19f01f0ea79f4c9f8ac33148b06e4df8.jpg	f
\.


--
-- Data for Name: product_size; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_size (size_id, variant_id, size_name, available_units, in_stock) FROM stdin;
8	7	L	100	t
9	7	M	100	t
10	7	XL	100	t
11	7	XXL	100	t
13	8	M	50	t
14	8	L	70	t
15	8	XL	65	t
16	8	XXL	30	t
17	9	L <65kg	120	t
18	9	M <58kg	100	t
19	9	XL <75kg	82	t
20	10	XL <75kg	33	t
21	10	M <58kg	44	t
22	10	L <65kg	55	t
23	11	L <65kg	75	t
24	11	M <58kg	41	t
25	12	Size M (40-49kg)	100	t
26	12	Size XL (60-69kg)	50	t
27	12	Size L (50-59kg)	200	t
28	12	Size 2XL (70-79kg)	20	t
29	12	Size 3XL (80-95kg)	15	t
30	24	6GB/128GB	20	t
31	25	6GB/128GB	15	t
32	26	10g	100	t
33	27	3 x 8 x 3 cm	100	t
34	28	3 x 8 x 3 cm	30	t
35	29	3 x 8 x 3 cm	60	t
36	30	180ml	130	t
37	31	180ml	90	t
38	32	415ml	88	t
39	32	520ml	72	t
40	32	1.1l	100	t
41	33	480ml	100	t
42	34	480ml	90	t
\.


--
-- Data for Name: product_variant; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_variant (variant_id, product_id, variant_name, price_adjustment) FROM stdin;
7	38	Nâu	0.00
8	38	Đen	0.00
9	39	Đen	0.00
10	39	Trắng	0.00
11	39	Xanh	0.00
12	36	Xanh Ve Chai H.61	0.00
13	36	Xanh Biển H.61	0.00
14	37	M1	0.00
15	37	M2	10.00
16	37	M3	10.00
17	37	M4	10.00
18	37	M5	0.00
19	37	M6	0.00
20	37	M7	0.00
21	37	M8	0.00
22	37	M9	0.00
23	37	M10	0.00
24	48	Đen Thạch Anh	0.00
25	48	Tím Ánh Sao	5.00
26	55	Kem Mờ Sẹo	0.00
27	56	Cam	0.00
28	56	Hồng	0.00
29	56	Xanh lá	0.00
30	58	Gạo	0.00
31	58	Trà Xanh	0.00
32	62	Bình nước thủy tinh Elmich	0.00
33	63	Xanh Mint	0.00
34	63	Xanh Đậm	0.00
\.


--
-- Data for Name: review; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.review (review_id, product_id, buyer_id, order_id, review_text, rating, is_verified, review_date) FROM stdin;
\.


--
-- Data for Name: review_image; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.review_image (review_image_id, review_id, image_url) FROM stdin;
\.


--
-- Data for Name: review_reply; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.review_reply (review_reply_id, review_id, seller_id, reply_text, reply_date) FROM stdin;
\.


--
-- Data for Name: seller; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.seller (seller_id, email, phone, fname, lname, password, shop_name, seller_tier, avt_url, average_rating, rating_count, is_active, created_at) FROM stdin;
3	duycp102k3@gmail.com		Hoàng	Duy	$2b$12$U0KISdJNlsbGuP5j6i1./.Gn73s/A9knlOPxbo.o/KKUHk1l5KWmm	Hoàng Store	regular	https://lh3.googleusercontent.com/a/ACg8ocJ7cP2G-gS8PhNvAuAlySZ-sbM0-t7ol1WXuYeR3fyPEzRaEig=s96-c	0.0	0	t	2025-10-19 13:10:14.456849
4	formenshop@example.com	0912345678	Nam	Nguyễn	$2b$12$jgzpQiXGBSwkOLEUkhNA9Oy486o7bEJ64Z7GVK1xEXVWVb9/BFU6G	Formen Shop	regular	avatars/2025/10/4ed5c95a75b64ba8bd169135203fa728.jpg	0.0	0	t	2025-10-24 02:12:42.636128
5	nesashop@example.com	0712344567	Thu	Nguyễn	$2b$12$Ft2Sutg3Eq6Fyon4CMm7SudqW.cyHZQhk8nI1gOI74rxuROWsNTqO	Nesa Shop	regular	avatars/2025/10/e1071cc405b24a09b99353467e6707e4.jpeg	0.0	0	t	2025-10-24 02:58:58.828688
8	joymall@example.com	0324506823	Joy	Mall	$2b$12$iRPKZxGH8oxY0qIwMiMY3eSMc26DjieL5PbUt1ODQUlULs7StJXkW	JoyMall Official	regular	avatars/2025/10/ed59eeb713b64e19a356e854aacf815a.jpeg	0.0	0	t	2025-10-24 05:23:15.660603
7	myphamauth@example.com	06341867475	Mỹ	Phẩm	$2b$12$jIhojCWoq8JAXrGKoDDI3uZ/ovAq7FBIWZ1frR7IqrVBiq.m7ZTRO	Mỹ Phẩm Auth 68	regular	avatars/2025/10/b9ff18c81c754fd99d626b4f7dc629c2.jpg	0.0	0	t	2025-10-24 04:45:25.50184
6	honghanhmobile@example.com	06341867319	Điện	Thoại	$2b$12$tDWZjgTln/rcOZO4goLfqeUKxW2v.HxxuLxQVXCp9Qt9tmp2Or6UC	Hồng Hạnh Mobile	regular	avatars/2025/10/9c6dd9b5416d43c5abc51ea1324278c2.jpg	0.0	0	t	2025-10-24 04:22:20.066064
\.


--
-- Data for Name: seller_address; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.seller_address (seller_address_id, seller_id, address_id, is_default, label) FROM stdin;
\.


--
-- Data for Name: shopping_cart; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopping_cart (shopping_cart_id, buyer_id, created_at, updated_at) FROM stdin;
2	1	2025-10-06 15:58:44.445106	2025-10-19 08:54:14.261906
\.


--
-- Data for Name: shopping_cart_item; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shopping_cart_item (shopping_cart_item_id, shopping_cart_id, product_id, variant_id, size_id, quantity, added_at) FROM stdin;
\.


--
-- Name: address_address_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.address_address_id_seq', 6, true);


--
-- Name: admin_admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_admin_id_seq', 2, true);


--
-- Name: buyer_address_buyer_address_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.buyer_address_buyer_address_id_seq', 6, true);


--
-- Name: buyer_buyer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.buyer_buyer_id_seq', 2, true);


--
-- Name: carrier_carrier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.carrier_carrier_id_seq', 3, true);


--
-- Name: category_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.category_category_id_seq', 32, true);


--
-- Name: discount_discount_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.discount_discount_id_seq', 2, true);


--
-- Name: order_item_order_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_item_order_item_id_seq', 1, false);


--
-- Name: order_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_order_id_seq', 1, false);


--
-- Name: product_image_product_image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_image_product_image_id_seq', 319, true);


--
-- Name: product_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_product_id_seq', 71, true);


--
-- Name: product_size_size_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_size_size_id_seq', 42, true);


--
-- Name: product_variant_variant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_variant_variant_id_seq', 34, true);


--
-- Name: review_image_review_image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.review_image_review_image_id_seq', 1, false);


--
-- Name: review_reply_review_reply_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.review_reply_review_reply_id_seq', 1, false);


--
-- Name: review_review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.review_review_id_seq', 1, false);


--
-- Name: seller_address_seller_address_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.seller_address_seller_address_id_seq', 1, false);


--
-- Name: seller_seller_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.seller_seller_id_seq', 8, true);


--
-- Name: shopping_cart_item_shopping_cart_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.shopping_cart_item_shopping_cart_item_id_seq', 3, true);


--
-- Name: shopping_cart_shopping_cart_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.shopping_cart_shopping_cart_id_seq', 2, true);


--
-- Name: address address_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.address
    ADD CONSTRAINT address_pkey PRIMARY KEY (address_id);


--
-- Name: admin admin_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_email_key UNIQUE (email);


--
-- Name: admin admin_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_phone_key UNIQUE (phone);


--
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (admin_id);


--
-- Name: buyer_address buyer_address_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buyer_address
    ADD CONSTRAINT buyer_address_pkey PRIMARY KEY (buyer_address_id);


--
-- Name: buyer buyer_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buyer
    ADD CONSTRAINT buyer_email_key UNIQUE (email);


--
-- Name: buyer buyer_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buyer
    ADD CONSTRAINT buyer_phone_key UNIQUE (phone);


--
-- Name: buyer buyer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buyer
    ADD CONSTRAINT buyer_pkey PRIMARY KEY (buyer_id);


--
-- Name: carrier carrier_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carrier
    ADD CONSTRAINT carrier_pkey PRIMARY KEY (carrier_id);


--
-- Name: category category_category_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_category_name_key UNIQUE (category_name);


--
-- Name: category category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_pkey PRIMARY KEY (category_id);


--
-- Name: discount discount_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount
    ADD CONSTRAINT discount_code_key UNIQUE (code);


--
-- Name: discount discount_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount
    ADD CONSTRAINT discount_pkey PRIMARY KEY (discount_id);


--
-- Name: order_item order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_pkey PRIMARY KEY (order_item_id);


--
-- Name: order order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_pkey PRIMARY KEY (order_id);


--
-- Name: product_image product_image_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_image
    ADD CONSTRAINT product_image_pkey PRIMARY KEY (product_image_id);


--
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (product_id);


--
-- Name: product_size product_size_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_size
    ADD CONSTRAINT product_size_pkey PRIMARY KEY (size_id);


--
-- Name: product_variant product_variant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variant
    ADD CONSTRAINT product_variant_pkey PRIMARY KEY (variant_id);


--
-- Name: review_image review_image_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_image
    ADD CONSTRAINT review_image_pkey PRIMARY KEY (review_image_id);


--
-- Name: review review_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_pkey PRIMARY KEY (review_id);


--
-- Name: review_reply review_reply_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reply
    ADD CONSTRAINT review_reply_pkey PRIMARY KEY (review_reply_id);


--
-- Name: seller_address seller_address_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_address
    ADD CONSTRAINT seller_address_pkey PRIMARY KEY (seller_address_id);


--
-- Name: seller seller_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller
    ADD CONSTRAINT seller_email_key UNIQUE (email);


--
-- Name: seller seller_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller
    ADD CONSTRAINT seller_phone_key UNIQUE (phone);


--
-- Name: seller seller_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller
    ADD CONSTRAINT seller_pkey PRIMARY KEY (seller_id);


--
-- Name: shopping_cart_item shopping_cart_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopping_cart_item
    ADD CONSTRAINT shopping_cart_item_pkey PRIMARY KEY (shopping_cart_item_id);


--
-- Name: shopping_cart shopping_cart_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopping_cart
    ADD CONSTRAINT shopping_cart_pkey PRIMARY KEY (shopping_cart_id);


--
-- Name: product_variant uq_product_variant_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variant
    ADD CONSTRAINT uq_product_variant_name UNIQUE (product_id, variant_name);


--
-- Name: product_size uq_variant_size_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_size
    ADD CONSTRAINT uq_variant_size_name UNIQUE (variant_id, size_name);


--
-- Name: idx_admin_admin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_admin_id ON public.admin USING btree (admin_id);


--
-- Name: idx_admin_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_email ON public.admin USING btree (email);


--
-- Name: idx_admin_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_phone ON public.admin USING btree (phone);


--
-- Name: idx_buyer_buyer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_buyer_buyer_id ON public.buyer USING btree (buyer_id);


--
-- Name: idx_buyer_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_buyer_email ON public.buyer USING btree (email);


--
-- Name: idx_buyer_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_buyer_phone ON public.buyer USING btree (phone);


--
-- Name: idx_product_size_variant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_size_variant_id ON public.product_size USING btree (variant_id);


--
-- Name: idx_product_sold_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_sold_category ON public.product USING btree (category_id, sold_quantity DESC);


--
-- Name: idx_product_sold_quantity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_sold_quantity ON public.product USING btree (sold_quantity DESC);


--
-- Name: idx_product_sold_seller; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_sold_seller ON public.product USING btree (seller_id, sold_quantity DESC);


--
-- Name: idx_product_variant_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_variant_product_id ON public.product_variant USING btree (product_id);


--
-- Name: buyer_address buyer_address_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buyer_address
    ADD CONSTRAINT buyer_address_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.address(address_id);


--
-- Name: buyer_address buyer_address_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buyer_address
    ADD CONSTRAINT buyer_address_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.buyer(buyer_id) ON DELETE CASCADE;


--
-- Name: order order_buyer_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_buyer_address_id_fkey FOREIGN KEY (buyer_address_id) REFERENCES public.buyer_address(buyer_address_id);


--
-- Name: order order_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.buyer(buyer_id);


--
-- Name: order order_carrier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_carrier_id_fkey FOREIGN KEY (carrier_id) REFERENCES public.carrier(carrier_id);


--
-- Name: order order_discount_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.discount(discount_id);


--
-- Name: order_item order_item_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_order_id_fkey FOREIGN KEY (order_id) REFERENCES public."order"(order_id) ON DELETE CASCADE;


--
-- Name: order_item order_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id);


--
-- Name: order_item order_item_size_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_size_id_fkey FOREIGN KEY (size_id) REFERENCES public.product_size(size_id);


--
-- Name: order_item order_item_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variant(variant_id);


--
-- Name: product product_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.category(category_id);


--
-- Name: product_image product_image_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_image
    ADD CONSTRAINT product_image_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- Name: product product_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.seller(seller_id) ON DELETE CASCADE;


--
-- Name: product_size product_size_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_size
    ADD CONSTRAINT product_size_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variant(variant_id) ON DELETE CASCADE;


--
-- Name: product_variant product_variant_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variant
    ADD CONSTRAINT product_variant_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- Name: review review_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.buyer(buyer_id);


--
-- Name: review_image review_image_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_image
    ADD CONSTRAINT review_image_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.review(review_id) ON DELETE CASCADE;


--
-- Name: review review_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_order_id_fkey FOREIGN KEY (order_id) REFERENCES public."order"(order_id);


--
-- Name: review review_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id);


--
-- Name: review_reply review_reply_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reply
    ADD CONSTRAINT review_reply_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.review(review_id) ON DELETE CASCADE;


--
-- Name: review_reply review_reply_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reply
    ADD CONSTRAINT review_reply_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.seller(seller_id);


--
-- Name: seller_address seller_address_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_address
    ADD CONSTRAINT seller_address_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.address(address_id);


--
-- Name: seller_address seller_address_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seller_address
    ADD CONSTRAINT seller_address_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.seller(seller_id) ON DELETE CASCADE;


--
-- Name: shopping_cart shopping_cart_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopping_cart
    ADD CONSTRAINT shopping_cart_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.buyer(buyer_id);


--
-- Name: shopping_cart_item shopping_cart_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopping_cart_item
    ADD CONSTRAINT shopping_cart_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id) ON DELETE CASCADE;


--
-- Name: shopping_cart_item shopping_cart_item_shopping_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopping_cart_item
    ADD CONSTRAINT shopping_cart_item_shopping_cart_id_fkey FOREIGN KEY (shopping_cart_id) REFERENCES public.shopping_cart(shopping_cart_id) ON DELETE CASCADE;


--
-- Name: shopping_cart_item shopping_cart_item_size_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopping_cart_item
    ADD CONSTRAINT shopping_cart_item_size_id_fkey FOREIGN KEY (size_id) REFERENCES public.product_size(size_id) ON DELETE CASCADE;


--
-- Name: shopping_cart_item shopping_cart_item_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shopping_cart_item
    ADD CONSTRAINT shopping_cart_item_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variant(variant_id) ON DELETE CASCADE;


--
-- Name: pub_all; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION pub_all FOR ALL TABLES WITH (publish = 'insert, update, delete, truncate');


--
-- PostgreSQL database dump complete
--

\unrestrict vqmnGgg1gC2YSqjN51fvuOjqNtjfbhQrdzDnZdTkL8snOWzdIfNuUIgWDgaD4VF

