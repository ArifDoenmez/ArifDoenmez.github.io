---
layout: page
permalink: /conferences/
title: conferences
description: attended conferences, talks, poster
years: [2022, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011]
nav: true
nav_order: 3
---

<!-- _pages/publications.md -->
<div class="publications">

{%- for y in page.years %}
  <h2 class="year">{{y}}</h2>
  {% bibliography -f conferences -q @*[year={{y}}]* %}
{% endfor %}

</div>
