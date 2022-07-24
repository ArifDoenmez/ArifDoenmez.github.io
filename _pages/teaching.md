---
layout: page
permalink: /teaching/
title: teaching
description: 
years: [2022, 2020, 2019, 2018, 2016, 2014]
nav: true
nav_order: 4
---

<!-- _pages/publications.md -->
<div class="publications">

{%- for y in page.years %}
  <h2 class="year">{{y}}</h2>
  {% bibliography -f teaching -q @*[year={{y}}]* %}
{% endfor %}

</div>
