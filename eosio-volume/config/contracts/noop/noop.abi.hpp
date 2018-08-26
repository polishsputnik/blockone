const char* const noop_abi = R"=====(
{
  "types": [{
      "new_type_name": "account_name",
      "type": "name"
    }
  ],
  "structs": [{
      "name": "anyaction",
      "base": "",
      "fields": [
        {"name":"from", "type":"account_name"},
        {"name":"type", "type":"string"},
        {"name":"data", "type":"string"}
      ]
    }
  ],
  "actions": [{
  "name":"anyaction",
  "type":"anyaction",
  "ricardian_contract": ""
  }
],
  "tables": [],
  "ricardian_clauses": []
}
)=====";
